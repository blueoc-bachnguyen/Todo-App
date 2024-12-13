import { Box, Button, FormControl, Icon, Input } from "@chakra-ui/react";
import { FaSearch } from "react-icons/fa";
import { useMutation } from "@tanstack/react-query";
import { type SubmitHandler, useForm } from "react-hook-form";
import { type ApiError, type TodosReadTodosData, TodosService } from "../../client";
import useCustomToast from "../../hooks/useCustomToast";
import { handleError } from "../../utils";
import { useRef } from "react";

interface SearchForm {
    search: string;
}

interface SearchComponentProps {
    onSearch: (search: string) => void;
    search: string;
}

const SearchComponent = ({ onSearch, search }: SearchComponentProps) => {
    const showToast = useCustomToast();
    const { 
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { isSubmitting },
    } = useForm<SearchForm>({
        mode: "onBlur",
        criteriaMode: "all"
    });

    const mutation = useMutation({
        mutationFn: async (data: TodosReadTodosData) => {
            console.log("Sending data to API:", data);
            return await TodosService.readTodos({ search: data.search });
        },
        onSuccess: () => {
            reset();
        },
        onError: (error: ApiError) => {
            console.error("Mutation error:", error);
            handleError(error, showToast);
        },
    });

    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    // Debounce API call when input changes
    const handleSearchChange = (value: string) => {
        // Clear previous timeout if there's any
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        // Set a new timeout to call the API after a delay (e.g., 500ms)
        debounceTimer.current = setTimeout(() => {
            if (value.trim() === "") {
                // Khi input rỗng, gọi API để lấy tất cả todo
                onSearch(""); // Chuyển đến API với search rỗng
                mutation.mutate({ search: "" });
            } else {
                onSearch(value); // Gọi API với giá trị tìm kiếm
                mutation.mutate({ search: value });
            }
        }, 500); // Delay 500ms
    };

    const onSubmit: SubmitHandler<SearchForm> = async (data) => {
        console.log("Form submitted with:", data);
        onSearch(data.search);  // Gọi onSearch để cập nhật searchQuery
        mutation.mutate(data);
        reset();
        setValue("search", "");
    };

    return (
        <Box as="form" onSubmit={handleSubmit(onSubmit)} display="flex" alignItems="center">
            <FormControl>
                <Input 
                    w="300px" 
                    placeholder="Search"
                    fontSize="md"
                    fontWeight="500"
                    {...register("search", { value: search })}
                    onChange={(e) => handleSearchChange(e.target.value)} // Call debounce handler on input change
                />
            </FormControl>
            <Button 
                gap={1} 
                fontSize={{ base: "sm", md: "inherit" }} 
                colorScheme="gray" 
                margin="0px 5px" 
                type="submit" 
                isLoading={isSubmitting}
            >
                <Icon as={FaSearch} /> Search
            </Button>   
        </Box>
    );
};

export default SearchComponent;

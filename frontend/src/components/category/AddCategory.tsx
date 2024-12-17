import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { type ApiError } from "../../client";
import useCustomToast from "../../hooks/useCustomToast";
import { handleError } from "../../utils";
import { useState } from "react";
import axios from "axios";

interface AddCategoryProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddCategory = ({ isOpen, onClose }: AddCategoryProps) => {
  const queryClient = useQueryClient();
  const showToast = useCustomToast();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      try {
        console.log(title, desc);
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/v1/categories`,
          {
            title,
            desc,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
          }
        );
        console.log(res);
      } catch (error) {}
    },
    onSuccess: () => {
      showToast("Success!", "Category created successfully.", "success");
      setTitle("")
      setDesc("")
      onClose();
    },
    onError: (err: ApiError) => {
      handleError(err, showToast);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["cats"] });
    },
  });

    const handleAddCategory = (e: any) => {
      e.preventDefault();
    mutation.mutate();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size={{ base: "sm", md: "md" }}
        isCentered
      >
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleAddCategory}>
          <ModalHeader>Add Category</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel htmlFor="title">Title</FormLabel>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                type="text"
              />
            </FormControl>
            <FormControl mt={4}>
              <FormLabel htmlFor="desc">Description</FormLabel>
              <Input
                id="desc"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Description"
                type="text"
              />
            </FormControl>
          </ModalBody>

          <ModalFooter gap={3}>
            <Button variant="primary" type="submit">
              Save
            </Button>
            <Button onClick={() => {
              onClose()
              setTitle("")
              setDesc("")
            }}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default AddCategory;

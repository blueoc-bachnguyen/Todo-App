import { createFileRoute } from "@tanstack/react-router";
import {
  Tr,
  Td,
  Th,
  Table,
  Tbody,
  Thead,
  Heading,
  Container,
  SkeletonText,
  TableContainer,
 Text,
  useDisclosure,
  Icon,
  Flex,
} from "@chakra-ui/react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "../../components/ui/button";
import ActionsMenuCategory from "../../components/category/ActionsMenuCategory.tsx";
import { PaginationFooter } from "../../components/Common/PaginationFooter.tsx";
import useCustomToast from "../../hooks/useCustomToast.ts";
import axios from "axios";
import { FaPlus } from "react-icons/fa";
import AddCategory from "../../components/category/AddCategory.tsx";
import { FcFullTrash } from "react-icons/fc";
import DeleteAllCategories from "../../components/category/DeleteAllCategories.tsx"

function CategoriesTable() {
  const queryClient = useQueryClient();
  const showToast = useCustomToast();

  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);

  const { data, isPending, isPlaceholderData } = useQuery({
    queryKey: ["cats",page],
    queryFn: async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/v1/categories?page=${page}&limit=5`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
          }
        );
        setPages(res?.data?.pages);
        return res;
      } catch (error: any) {
        showToast("Error", error.message, "error");
      }
    },
  });
    
  const hasPreviousPage = page >= 1;
  const hasNextPage = page < pages;

  const changeLevelMutation = useMutation({
    mutationFn: async (data: { id: string; level: string }) => {
      try {
       await axios.put(
          `${import.meta.env.VITE_API_URL}/api/v1/categories/${data.id}`,
          {
            level: data.level,
            },
            {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('access_token')}`
              }
          }
        );
      } catch (error: any) {
        showToast("Error", error.message, "error");
      }
      },
       onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["cats"] });
    },
  });

  const changeCategoryLevel = (data: { id: string; level: string }) => {
    changeLevelMutation.mutate(data);
  };

  return (
    <>
      {data?.data?.data?.length > 0 ? <>
        <TableContainer>
        <Table
          variant="striped"
          colorScheme="gray"
          size={{ base: "sm", md: "md" }}
        >
          <Thead>
            <Tr>
              {/* <Th>ID</Th> */}
              <Th>Title</Th>
              <Th>Description</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          {isPending ? (
            <Tbody>
              <Tr>
                {new Array(6).fill(null).map((_, index) => (
                  <Td key={index}>
                    <SkeletonText noOfLines={1} paddingBlock="16px" />
                  </Td>
                ))}
              </Tr>
            </Tbody>
          ) : (
            <Tbody>
              {data?.data?.data?.map((cat: any) => (
                <Tr key={cat.id} opacity={isPlaceholderData ? 0.5 : 1}>
                  {/* <Td>{cat.id}</Td> */}
                  <Td isTruncated maxWidth="150px" >
                    {cat.title}
                  </Td>
                  <Td
                    color={!cat.desc ? "ui.dim" : "inherit"}
                    isTruncated
                    maxWidth="150px"
                  >
                    {cat.desc || "N/A"}
                  </Td>
                  <Td >
                    {cat.level === "low" ? (
                      <Button
                        size="md"
                        minW={"100px"}
                        colorScheme="blue"
                        onClick={() =>
                          changeCategoryLevel({ id: cat.id, level: "medium" })
                        }
                      >
                        Low
                      </Button>
                    ) : cat.level === "medium" ? (
                      <Button
                          size="md"
                        minW={"100px"}
                          
                        colorScheme="yellow"
                        onClick={() =>
                          changeCategoryLevel({ id: cat.id, level: "high" })
                        }
                      >
                        Medium
                      </Button>
                    ) : (
                      <Button
                            size="md"
                        minW={"100px"}
                            
                        colorScheme="red"
                        onClick={() =>
                          changeCategoryLevel({ id: cat.id, level: "low" })
                        }
                      >
                        High
                      </Button>
                    )}
                  </Td>
                  <Td>
                    <ActionsMenuCategory value={cat} currentPage={page} setCurrentPage={setPage} />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          )}
        </Table>
      </TableContainer>
      <PaginationFooter
        page={page}
        onChangePage={setPage}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
      />
      </> : <Text fontSize='6xl' color={"teal"} align={"center"} margin={"50px 0"}>Let's create new category😉</Text>}
      
    </>
  );
}

function Categories() {
  const addModal = useDisclosure();
  const deleteAllModal = useDisclosure();

  return (
    <Container maxW="full">
      <Heading size="lg" textAlign={{ base: "center", md: "left" }} pt={12}>
        Categories Management
      </Heading>
      <Flex gap={'5'}>
        <Flex
        py={5}
        gap={4}
        align="center"
        flexWrap="wrap"
        margin="20px 0px 10px 0px"
      >
        <Button
          variant="primary"
          gap={1}
          fontSize={{ base: "sm", md: "inherit" }}
          onClick={addModal.onOpen}
        >
          <Icon as={FaPlus} /> Add Category
        </Button>
        <AddCategory isOpen={addModal.isOpen} onClose={addModal.onClose} />
      </Flex>
      <Flex
        py={5}
        gap={4}
        align="center"
        flexWrap="wrap"
        margin="20px 0px 10px 0px"
      >
        <Button
            gap={1}
            colorScheme='red'
          fontSize={{ base: "sm", md: "inherit" }}
          onClick={deleteAllModal.onOpen}
        >
          <Icon as={FcFullTrash} /> Delete All Category
        </Button>
        <DeleteAllCategories isOpen={deleteAllModal.isOpen} onClose={deleteAllModal.onClose} />
      </Flex>
      </Flex>
      <CategoriesTable />
    </Container>
  );
}

export const Route = createFileRoute("/_layout/categories")({
  component: Categories,
});

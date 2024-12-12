import {
  Tr,
  Td,
  Th,
  Table,
  Tbody,
  Thead,
  Modal,
  Stack,
  Heading,
  Container,
  SkeletonText,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react"
import { Button } from "../../components/ui/button"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { z } from "zod"

import { TodosService } from "../../client/index.ts"
import ActionsMenu from "../../components/Common/ActionsMenu.tsx"
import Navbar from "../../components/Common/Navbar.tsx"
import AddTodo from "../../components/todos/Addtodos.tsx"
import { PaginationFooter } from "../../components/Common/PaginationFooter.tsx"

const todosSearchSchema = z.object({
  page: z.number().catch(1),
})

export const Route = createFileRoute('/_layout/todos')({
  component: Todos,
  validateSearch: (search) => todosSearchSchema.parse(search),
});

const PER_PAGE = 7;
const todosSearchSchema = z.object({
  page: z.number().catch(1),
});

const getTodosQueryOptions = ({ page }: { page: number }) => {
  return {
    queryFn: () =>
      TodosService.readTodos({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }),
    queryKey: ["todos", { page }],
  }
}

function TodosTable() {
  const queryClient = useQueryClient()
  const { page } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const setPage = (page: number) =>
    navigate({ search: (prev: {[key: string]: string}) => ({ ...prev, page }) })
  const {
    data: todos,
    isPending,
    isPlaceholderData,
  } = useQuery({
    ...getTodosQueryOptions({ page }),
    
    placeholderData: (prevData) => prevData,
  });

  const {
    data: subtodos,
    isFetching: isFetchingSubTodos,
    refetch,
  } = useQuery({
    ...getSubTodosQueryOptions(selectedTodoId || ''),
    enabled: !!selectedTodoId,
  });

  const setPage = (page: number) =>
    navigate({
      search: (prev: { [key: string]: string }) => ({ ...prev, page }),
    });
  const hasNextPage = !isPlaceholderData && todos?.data.length === PER_PAGE;
  const hasPreviousPage = page > 1;

  useEffect(() => {
    if (hasNextPage) {
      queryClient.prefetchQuery(getTodosQueryOptions({ page: page + 1 }));
    }
  }, [page, queryClient, hasNextPage]);

  const changeTodoStatus = async (
    todoId: string,
    newStatus: 'pending' | 'completed' | 'in_progress'
  ) => {
    try {
      queryClient.setQueryData(['todos', { page }], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: oldData.data.map((todo: any) =>
            todo.id === todoId ? { ...todo, status: newStatus } : todo
          ),
        };
      });

      await TodosService.updateTodo({
        id: todoId,
        requestBody: { status: newStatus },
      });

      queryClient.invalidateQueries({
        queryKey: ['todos'],
        exact: true,
        refetchType: 'active',
      });
    } catch (error) {
      console.error('Failed to change status', error);
    }
  };

  const changeSubTodoStatus = async (
    subTodoId: string,
    todoId: string,
    newStatus: 'pending' | 'completed' | 'in_progress'
  ) => {
    try {
      queryClient.setQueryData(['subtodos'], (oldData: any) => {
        if (!oldData || !oldData.data) return oldData;
        return {
          ...oldData,
          data: oldData.data.map((subtodo: any) =>
            subtodo.id === subTodoId
              ? { ...subtodo, status: newStatus }
              : subtodo
          ),
        };
      });

      await SubTodosService.updateSubTodo({
        id: subTodoId,
        todo_id: todoId,
        requestBody: { status: newStatus },
      });
      refetch();
    } catch (error) {
      console.error('Failed to change status', error);
    }
  };

  const handleListClick = (todoId: string) => {
    const todo = todos?.data.find((t) => t.id === todoId);
    setSelectedTodo(todo || null);
    setSelectedTodoId(todoId);
    onOpen();
  };

  return (
    <>
      <TableContainer>
        <Table
          variant="striped"
          colorScheme="gray"
          size={{ base: 'sm', md: 'md' }}
        >
          <Thead>
            <Tr>
              <Th>ID</Th>
              <Th>Title</Th>
              <Th>Description</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
              <Th>SubTodos</Th>
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
              {todos?.data
                ?.filter(
                  (todo) =>
                    todo.title
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase()) ||
                    todo.desc
                      ?.toLowerCase()
                      .includes(searchQuery.toLowerCase()) ||
                    todo.status
                      .replace('_', ' ')
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase())
                )
                .map((todo) => (
                  <Tr key={todo.id} opacity={isPlaceholderData ? 0.5 : 1}>
                    <Td>{todo.id}</Td>
                    <Td isTruncated maxWidth="150px">
                      {todo.title}
                    </Td>
                    <Td
                      color={!todo.desc ? 'ui.dim' : 'inherit'}
                      isTruncated
                      maxWidth="150px"
                    >
                      {todo.desc || 'N/A'}
                    </Td>
                    <Td>
                      {todo.status === 'in_progress' ? (
                        <Button
                          size="sm"
                          colorScheme="blue"
                          onClick={() => changeTodoStatus(todo.id, 'pending')}
                        >
                          In Progress
                        </Button>
                      ) : todo.status === 'completed' ? (
                        <Button
                          size="sm"
                          colorScheme="green"
                          onClick={() =>
                            changeTodoStatus(todo.id, 'in_progress')
                          }
                        >
                          Completed
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          colorScheme="yellow"
                          onClick={() => changeTodoStatus(todo.id, 'completed')}
                        >
                          Pending
                        </Button>
                      )}
                    </Td>
                    <Td>
                      <ActionsMenu type={'Todo'} value={todo} />
                    </Td>
                    <Td>
                      <IoIosList
                        size={20}
                        onClick={() => handleListClick(todo.id)}
                        style={{ cursor: 'pointer' }}
                      />
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

      <Modal
        size="6xl"
        isCentered
        isOpen={isOpen}
        onClose={onClose}
        closeOnOverlayClick={false}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>All SubTodos of {selectedTodo?.title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {isFetchingSubTodos ? (
              <SkeletonText noOfLines={4} spacing="4" />
            ) : subtodos?.data?.length ? (
              <TableContainer>
                <Table variant="striped" colorScheme="gray" size="5xl">
                  <Thead>
                    <Tr>
                      <Th>ID</Th>
                      <Th>Title</Th>
                      <Th>Description</Th>
                      <Th>Status</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {subtodos.data.map((subtodo) => (
                      <Tr key={subtodo.id}>
                        <Td>{subtodo.id}</Td>
                        <Td>{subtodo.title}</Td>
                        <Td>{subtodo.desc || 'N/A'}</Td>
                        <Td>
                          {subtodo.status === 'in_progress' ? (
                            <Button
                              size="sm"
                              colorScheme="blue"
                              onClick={() =>
                                changeSubTodoStatus(
                                  subtodo.id,
                                  subtodo.todo_id,
                                  'pending'
                                )
                              }
                            >
                              In Progress
                            </Button>
                          ) : subtodo.status === 'completed' ? (
                            <Button
                              size="sm"
                              colorScheme="green"
                              onClick={() =>
                                changeSubTodoStatus(
                                  subtodo.id,
                                  subtodo.todo_id,
                                  'in_progress'
                                )
                              }
                            >
                              Completed
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              colorScheme="yellow"
                              onClick={() =>
                                changeSubTodoStatus(
                                  subtodo.id,
                                  subtodo.todo_id,
                                  'completed'
                                )
                              }
                            >
                              Pending
                            </Button>
                          )}
                        </Td>
                        <Td>
                          <Stack direction="row" spacing={4} align="center">
                            <Button
                              size="sm"
                              colorScheme="orange"
                              onClick={() => {
                                setSelectedSubTodo(subtodo);
                                editSubTodoModal.onOpen();
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              colorScheme="red"
                              variant="outline"
                              onClick={() =>
                                handleOpenDeleteModal(
                                  subtodo.id,
                                  selectedTodoId || ''
                                )
                              }
                            >
                              Delete
                            </Button>
                          </Stack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            ) : (
              <p>No subtasks available</p>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
      {selectedSubTodo && (
        <EditSubTodo
          subtodo={selectedSubTodo}
          isOpen={editSubTodoModal.isOpen}
          onClose={() => {
            setSelectedSubTodo(null);
            editSubTodoModal.onClose();
          }}
        />
      )}
      {deleteSubTodoId && (
        <Delete
          type="SubTodo"
          id={deleteSubTodoId}
          todoId={selectedTodoId || undefined}
          isOpen={isDeleteSubTodoModalOpen}
          onClose={handleCloseDeleteModal}
        />
      )}
    </>
  );
}

function TodosCollaboratorTable() {
  const queryClient = useQueryClient()
  const { page } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const setPage = (page: number) =>
    navigate({ search: (prev: {[key: string]: string}) => ({ ...prev, page }) })
  const {
    data: items,
    isPending,
    isPlaceholderData,
  } = useQuery({
    ...getCollaboratedTodosQueryOptions({ page }),
    placeholderData: (prevData) => prevData,
  })

  const hasNextPage = !isPlaceholderData && items?.data.length === PER_PAGE
  const hasPreviousPage = page > 1

  useEffect(() => {
    if (hasNextPage) {
      queryClient.prefetchQuery(getCollaboratedTodosQueryOptions({ page: page + 1 }))
    }
  }, [page, queryClient, hasNextPage])
  
  const changeStatus = async (todoId: string, newStatus: "pending" | "completed" | "in_progress") => {
    try {
      // Optimistic update
      queryClient.setQueryData(["collaborations", { page }], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: oldData.data.map((todo: any) =>
            todo.id === todoId ? { ...todo, status: newStatus } : todo
          ),
        };
      });
  
      // Call API to persist changes
      await TodosService.updateTodo({ id: todoId, requestBody: { status: newStatus } });
  
      // Optionally refresh data after successful update
      queryClient.invalidateQueries({ queryKey: ["collaborations"], exact: true, refetchType: "active" });
    } catch (error) {
      console.error("Failed to change status", error);
    }
  };

  return (
    <>
      <TableContainer>
        <Table size={{ base: "sm", md: "md" }}>
          <Thead>
            <Tr>
              <Th>ID</Th>
              <Th>Title</Th>
              <Th>Description</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          {isPending ? (
            <Tbody>
              <Tr>
                {new Array(4).fill(null).map((_, index) => (
                  <Td key={index}>
                    <SkeletonText noOfLines={1} paddingBlock="16px" />
                  </Td>
                ))}
              </Tr>
            </Tbody>
          ) : (
            <Tbody>
              {items?.data.map((todo) => (
                <Tr key={todo.id} opacity={isPlaceholderData ? 0.5 : 1}>
                  <Td>{todo.id}</Td>
                  <Td isTruncated maxWidth="150px">
                    {todo.title}
                  </Td>
                  <Td
                    color={!todo.desc ? "ui.dim" : "inherit"}
                    isTruncated
                    maxWidth="150px"
                  >
                    {todo.desc || "N/A"}
                  </Td>
                  <Td>
                    {todo.status === "in_progress" ? (
                      <Button size="sm" colorScheme="blue" onClick={() => changeStatus(todo.id, "pending")}>
                        In Progress
                      </Button>
                    ) : todo.status === "completed" ? (
                      <Button size="sm" colorScheme="green" onClick={() => changeStatus(todo.id, "in_progress")}>
                        Completed
                      </Button>
                    ) : (
                      <Button size="sm" colorScheme="yellow" onClick={() => changeStatus(todo.id, "completed")}>
                        Pending
                      </Button>
                    )}
                  </Td>
                  <Td>
                    <ActionsMenuForCollaborator type={"Todo"} value={todo} />
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
    </>
  )
}

function Todos() {
  const [searchQuery, setSearchQuery] = useState<string>(''); // Trạng thái lưu từ khóa tìm kiếm

  const handleSearch = (search: string) => {
    setSearchQuery(search); // Cập nhật trạng thái tìm kiếm
  };

  return (
    <Container maxW="full">
      <Heading size="lg" textAlign={{ base: 'center', md: 'left' }} pt={12}>
        Todo List Management
      </Heading>

      <Navbar type={"Todo"} addModalAs={AddTodo} />
      <TodosTable />
    </Container>
  );
}

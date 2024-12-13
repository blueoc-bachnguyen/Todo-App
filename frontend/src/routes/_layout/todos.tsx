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
  ModalBody,
  ModalHeader,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { z } from 'zod';
import { IoIosList } from 'react-icons/io';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { Button } from '../../components/ui/button';
import Navbar from '../../components/Common/Navbar.tsx';
import AddTodo from '../../components/Todo/AddTodo.tsx';
import Delete from '../../components/Common/DeleteAlert.tsx';
import ActionsMenu from '../../components/Common/ActionsMenu.tsx';
import EditSubTodo from '../../components/SubTodo/EditSubTodo.tsx';
import { PaginationFooter } from '../../components/Common/PaginationFooter.tsx';

import { SubTodoPublic } from '../../client/index.ts';
import { TodosService, SubTodosService } from '../../client/index.ts';

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
    queryKey: ['todos', { page }],
  };
};

const getSubTodosQueryOptions = (todo_id: string) => {
  return {
    queryFn: () => SubTodosService.getSubTodoByTodoId({ todo_id }),
    queryKey: ['subtodos', todo_id],
    enabled: !!todo_id,
  };
};

function TodosTable({ searchQuery }: { searchQuery: string }) {
  const { page } = Route.useSearch();
  const queryClient = useQueryClient();
  const [selectedSubTodo, setSelectedSubTodo] = useState<SubTodoPublic | null>(
    null
  );
  const editSubTodoModal = useDisclosure();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate({ from: Route.fullPath });
  const [selectedTodo, setSelectedTodo] = useState<any | null>(null);
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);
  const [isDeleteSubTodoModalOpen, setIsDeleteSubTodoModalOpen] =
    useState(false);
  const [deleteSubTodoId, setDeleteSubTodoId] = useState<string | null>(null);

  const handleOpenDeleteModal = (subTodoId: string, todoId: string) => {
    setDeleteSubTodoId(subTodoId);
    setSelectedTodoId(todoId);
    setIsDeleteSubTodoModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setDeleteSubTodoId(null);
    setIsDeleteSubTodoModalOpen(false);
  };

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

function Todos() {
  const [searchQuery, setSearchQuery] = useState<string>(''); // Trạng thái lưu từ khóa tìm kiếm

  const handleSearch = (search: string) => {
    setSearchQuery(search); // Cập nhật trạng thái tìm kiếm
  };

  return (
    <Container maxW="full">
      <Heading size="lg" textAlign={{ base: 'center', md: 'left' }} pt={12}>
        Todo Management
      </Heading>
      <Navbar
        type={'Todo'}
        addModalAs={AddTodo}
        onSearch={handleSearch}
        search={searchQuery}
      />
      <TodosTable searchQuery={searchQuery} />
    </Container>
  );
}

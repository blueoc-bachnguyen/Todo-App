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
import AddTodo from '../../components/todos/Addtodos.tsx';
import Delete from '../../components/Common/DeleteAlert.tsx';
import ActionsMenu from '../../components/Common/ActionsMenu.tsx';
import EditSubTodo from '../../components/subtodos/EditSubTodo.tsx';
import { PaginationFooter } from '../../components/Common/PaginationFooter.tsx';

import { SubTodoPublic } from '../../client/index.ts';
import { TodosService, SubTodosService } from '../../client/index.ts';

export const Route = createFileRoute('/_layout/invitionConfirm')({
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
      TodosService.getPendingTodoForCollaborator({
        skip: (page - 1) * PER_PAGE, limit: PER_PAGE,
        user_id: ''
      }),
    queryKey: ['collaborations', { page }],
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
  const navigate = useNavigate({ from: Route.fullPath });

  const setPage = (page: number) =>
    navigate({
      search: (prev: { [key: string]: string }) => ({ ...prev, page }),
    });

  const {
    data: todos,
    isPending,
    isPlaceholderData,
    refetch,
  } = useQuery({
    ...getTodosQueryOptions({ page }),
    
    placeholderData: (prevData) => prevData,
  });

  const hasNextPage = !isPlaceholderData && todos?.data.length === PER_PAGE;
  const hasPreviousPage = page > 1;

  useEffect(() => {
    if (hasNextPage) {
      queryClient.prefetchQuery(getTodosQueryOptions({ page: page + 1 }));
    }
  }, [page, queryClient, hasNextPage]);

  const ConfirmCollaborateTodo = async (
    subTodoId: string,
    todoId: string,
    newStatus: 'pending' | 'ACCEPTED' | 'REJECTED'
  ) => {
    try {
      queryClient.setQueryData(['collaborations'], (oldData: any) => {
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

      await TodosService.ConfirmCollaborateTodo({
        todo_id: todoId,
        requestBody: { status: newStatus },
      });
      refetch();
    } catch (error) {
      console.error('Failed to change status', error);
    }
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
              {/* <Th>Actions</Th>
              <Th>SubTodos</Th> */}
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
                    <Td>{todo.status}</Td>
                    <Td>
                      <Button
                        size="sm"
                        onClick={() => ConfirmCollaborateTodo('', todo.id, 'ACCEPTED')}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => ConfirmCollaborateTodo('', todo.id, 'REJECTED')}
                      >
                        Reject
                      </Button>
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
        Invitation Collaborate
      </Heading>
      <Navbar
        type={'Todo'}
        addModalAs={AddTodo}
        onSearch={handleSearch}
        search={searchQuery}
      />
      <TodosTable searchQuery={searchQuery}/>
    </Container>
  );
}

// import {
//   Container,
//   Heading,
//   SkeletonText,
//   Table,
//   TableContainer,
//   Tbody,
//   Td,
//   Th,
//   Thead,
//   Tr,
// } from '@chakra-ui/react';
// import { Button } from '../../components/ui/button';
// import { useQuery, useQueryClient } from '@tanstack/react-query';
// import { createFileRoute, useNavigate } from '@tanstack/react-router';
// import { useEffect } from 'react';
// import { z } from 'zod';

// import { SubTodosService } from '../../client/index.ts';
// // import ActionsMenu from '../../components/Common/ActionsMenu.tsx';
// import Navbar from '../../components/Common/Navbar.tsx';
// import AddSubItem from '../../components/subtodos/AddSubTodo.tsx';
// import { PaginationFooter } from '../../components/Common/PaginationFooter.tsx';

// const subtodosSearchSchema = z.object({
//   page: z.number().catch(1),
// });

// export const Route = createFileRoute('/_layout/subtodos')({
//   component: SubTodos,
//   validateSearch: (search) => subtodosSearchSchema.parse(search),
// });

// const PER_PAGE = 5;

// function getSubTodosQueryOptions({ page }: { page: number }) {
//   return {
//     queryFn: () =>
//       SubTodosService.readSubTodos({
//         skip: (page - 1) * PER_PAGE,
//         limit: PER_PAGE,
//       }),
//     queryKey: ['todos', { page }],
//   };
// }

// function SubTodosTable() {
//   const queryClient = useQueryClient();
//   const { page } = Route.useSearch();
//   const navigate = useNavigate({ from: Route.fullPath });
//   const setPage = (page: number) =>
//     navigate({
//       search: (prev: { [key: string]: string }) => ({ ...prev, page }),
//     });
//   const {
//     data: items,
//     isPending,
//     isPlaceholderData,
//   } = useQuery({
//     ...getSubTodosQueryOptions({ page }),
//     placeholderData: (prevData) => prevData,
//   });

//   const hasNextPage = !isPlaceholderData && items?.data.length === PER_PAGE;
//   const hasPreviousPage = page > 1;

//   useEffect(() => {
//     if (hasNextPage) {
//       queryClient.prefetchQuery(getSubTodosQueryOptions({ page: page + 1 }));
//     }
//   }, [page, queryClient, hasNextPage]);

//   const changeStatus = async (
//     todoId: string,
//     newStatus: 'pending' | 'completed' | 'in_progress'
//   ) => {
//     try {
//       // Optimistic update
//       queryClient.setQueryData(['subtodos', { page }], (oldData: any) => {
//         if (!oldData) return oldData;
//         return {
//           ...oldData,
//           data: oldData.data.map((subtodo: any) =>
//             subtodo.id === todoId ? { ...subtodo, status: newStatus } : subtodo
//           ),
//         };
//       });

//       // Call API to persist changes
//       await SubTodosService.updateSubTodo({
//         id: todoId,
//         requestBody: { status: newStatus },
//       });

//       // Optionally refresh data after successful update
//       queryClient.invalidateQueries({
//         queryKey: ['todos'],
//         exact: true,
//         refetchType: 'active',
//       });
//     } catch (error) {
//       console.error('Failed to change status', error);
//     }
//   };

//   return (
//     <>
//       <TableContainer>
//         <Table size={{ base: 'sm', md: 'md' }}>
//           <Thead>
//             <Tr>
//               <Th>ID</Th>
//               <Th>Title</Th>
//               <Th>Description</Th>
//               <Th>Status</Th>
//               <Th>Actions</Th>
//             </Tr>
//           </Thead>
//           {isPending ? (
//             <Tbody>
//               <Tr>
//                 {new Array(4).fill(null).map((_, index) => (
//                   <Td key={index}>
//                     <SkeletonText noOfLines={1} paddingBlock="16px" />
//                   </Td>
//                 ))}
//               </Tr>
//             </Tbody>
//           ) : (
//             <Tbody>
//               {items?.data.map((todo) => (
//                 <Tr key={todo.id} opacity={isPlaceholderData ? 0.5 : 1}>
//                   <Td>{todo.id}</Td>
//                   <Td isTruncated maxWidth="150px">
//                     {todo.title}
//                   </Td>
//                   <Td
//                     color={!todo.desc ? 'ui.dim' : 'inherit'}
//                     isTruncated
//                     maxWidth="150px"
//                   >
//                     {todo.desc || 'N/A'}
//                   </Td>
//                   <Td>
//                     {todo.status === 'in_progress' ? (
//                       <Button
//                         size="sm"
//                         colorScheme="blue"
//                         onClick={() => changeStatus(todo.id, 'pending')}
//                       >
//                         In Progress
//                       </Button>
//                     ) : todo.status === 'completed' ? (
//                       <Button
//                         size="sm"
//                         colorScheme="green"
//                         onClick={() => changeStatus(todo.id, 'in_progress')}
//                       >
//                         Completed
//                       </Button>
//                     ) : (
//                       <Button
//                         size="sm"
//                         colorScheme="yellow"
//                         onClick={() => changeStatus(todo.id, 'completed')}
//                       >
//                         Pending
//                       </Button>
//                     )}
//                   </Td>
//                   <Td>{/* <ActionsMenu type={'Todo'} value={todo} /> */}</Td>
//                 </Tr>
//               ))}
//             </Tbody>
//           )}
//         </Table>
//       </TableContainer>
//       <PaginationFooter
//         page={page}
//         onChangePage={setPage}
//         hasNextPage={hasNextPage}
//         hasPreviousPage={hasPreviousPage}
//       />
//     </>
//   );
// }

// function SubTodos() {
//   return (
//     <Container maxW="full">
//       <Heading size="lg" textAlign={{ base: 'center', md: 'left' }} pt={12}>
//         Sub ToDo List Management
//       </Heading>

//       <Navbar type={'subtodo'} addModalAs={AddSubItem} />
//       <SubTodosTable />
//     </Container>
//   );
// }

// export default SubTodos;

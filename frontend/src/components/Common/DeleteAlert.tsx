import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
} from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { SubTodosService, TodosService, UsersService } from '../../client';
import useCustomToast from '../../hooks/useCustomToast';

interface DeleteProps {
  type: string;
  id: string;
  todoId?: string;
  isOpen: boolean;
  onClose: () => void;
}

const Delete = ({ type, id, todoId, isOpen, onClose }: DeleteProps) => {
  const queryClient = useQueryClient();
  const showToast = useCustomToast();
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const {
    handleSubmit,
    formState: { isSubmitting },
  } = useForm();

  const deleteEntity = async ({
    id,
    todoId,
  }: {
    id: string;
    todoId?: string;
  }) => {
    if (type === 'Todo') {
      await TodosService.deleteTodo({ id: id });
    } else if (type === 'SubTodo') {
      if (!todoId) {
        throw new Error('Id of Todo is required to delete a SubTodo');
      }
      await SubTodosService.deleteSubTodo({ todo_id: todoId, id: id });
    } else if (type === 'User') {
      await UsersService.deleteUser({ userId: id });
    } else {
      throw new Error(`Unexpected type: ${type}`);
    }
  };

  const mutation = useMutation({
    mutationFn: deleteEntity,
    onSuccess: () => {
      showToast(
        'Success',
        `The ${type.toLowerCase()} was deleted successfully.`,
        'success'
      );
      onClose();
    },
    onError: () => {
      showToast(
        'An error occurred.',
        `An error occurred while deleting the ${type.toLowerCase()}.`,
        'error'
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [
          type === 'Todo' ? 'todos' : type === 'users' ? 'users' : 'subtodos',
        ],
      });
    },
  });

  const onSubmit = async () => {
    mutation.mutate({ id, todoId }); // Pass an object as expected
  };

  return (
    <>
      <AlertDialog
        isCentered
        isOpen={isOpen}
        onClose={onClose}
        leastDestructiveRef={cancelRef}
        size={{ base: 'sm', md: 'md' }}
      >
        <AlertDialogOverlay>
          <AlertDialogContent as="form" onSubmit={handleSubmit(onSubmit)}>
            <AlertDialogHeader>Delete {type}</AlertDialogHeader>

            <AlertDialogBody>
              {type === 'User' && (
                <span>
                  All items associated with this user will also be{' '}
                  <strong>permantly deleted. </strong>
                </span>
              )}
              Are you sure? You will not be able to undo this action.
            </AlertDialogBody>

            <AlertDialogFooter gap={3}>
              <Button variant="danger" type="submit" isLoading={isSubmitting}>
                Delete
              </Button>
              <Button
                ref={cancelRef}
                onClick={onClose}
                isDisabled={isSubmitting}
              >
                Cancel
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default Delete;

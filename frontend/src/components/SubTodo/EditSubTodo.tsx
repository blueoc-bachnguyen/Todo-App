import {
  Input,
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalCloseButton,
  FormLabel,
  FormControl,
  FormErrorMessage,
} from '@chakra-ui/react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  type ApiError,
  type SubTodoPublic,
  type SubTodoUpdate,
  SubTodosService,
} from '../../client';
import { handleError } from '../../utils';
import useCustomToast from '../../hooks/useCustomToast';

interface EditSubTodoProps {
  subtodo: SubTodoPublic;
  isOpen: boolean;
  onClose: () => void;
}

const EditSubTodo = ({ subtodo, isOpen, onClose }: EditSubTodoProps) => {
  const showToast = useCustomToast();
  const queryClient = useQueryClient();
  const {
    reset,
    register,
    handleSubmit,
    formState: { isSubmitting, errors, isDirty },
  } = useForm<SubTodoUpdate>({
    mode: 'onBlur',
    criteriaMode: 'all',
    defaultValues: subtodo,
  });

  const mutation = useMutation({
    mutationFn: (data: SubTodoUpdate) =>
      SubTodosService.updateSubTodo({
        id: subtodo.id,
        todo_id: subtodo.todo_id,
        requestBody: data,
      }),
    onSuccess: () => {
      showToast('Success!', 'Sub todo is updated successfully.', 'success');
      onClose();
    },
    onError: (err: ApiError) => {
      handleError(err, showToast);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['subtodos'] });
    },
  });

  const onSubmit: SubmitHandler<SubTodoUpdate> = async (data) => {
    mutation.mutate(data);
  };

  const onCancel = () => {
    reset();
    onClose();
  };

  return (
    <>
      <Modal
        size="md"
        isCentered
        isOpen={isOpen}
        onClose={onClose}
        closeOnOverlayClick={false}
      >
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>Edit {subtodo.title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl isInvalid={!!errors.title}>
              <FormLabel htmlFor="title">Title</FormLabel>
              <Input
                id="title"
                {...register('title', {
                  required: 'Title is required',
                })}
                type="text"
              />
              {errors.title && (
                <FormErrorMessage>{errors.title.message}</FormErrorMessage>
              )}
            </FormControl>
            <FormControl mt={4}>
              <FormLabel htmlFor="desc">Description</FormLabel>
              <Input
                id="desc"
                {...register('desc')}
                placeholder="Description"
                type="text"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter gap={3}>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
              isDisabled={!isDirty}
            >
              Save
            </Button>
            <Button onClick={onCancel}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default EditSubTodo;

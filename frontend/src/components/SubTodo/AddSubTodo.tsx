import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type SubmitHandler, useForm } from 'react-hook-form';

import {
  type ApiError,
  type SubTodoCreate,
  SubTodosService,
} from '../../client';
import useCustomToast from '../../hooks/useCustomToast';
import { handleError } from '../../utils';

interface AddSubTodoProps {
  isOpen: boolean;
  onClose: () => void;
  todoId: string;
}

const AddSubTodo = ({ isOpen, onClose, todoId }: AddSubTodoProps) => {
  const queryClient = useQueryClient();
  const showToast = useCustomToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SubTodoCreate>({
    mode: 'onBlur',
    criteriaMode: 'all',
    defaultValues: {
      title: '',
      desc: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: SubTodoCreate) =>
      SubTodosService.createSubTodo({ requestBody: data, todo_id: todoId }),
    onSuccess: () => {
      showToast('Success!', 'Sub task is created successfully.', 'success');
      reset();
      onClose();
    },
    onError: (err: ApiError) => {
      handleError(err, showToast);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todo_id'] });
    },
  });

  const onSubmit: SubmitHandler<SubTodoCreate> = (data) => {
    mutation.mutate({ ...data, todo_id: todoId });
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size={{ base: 'sm', md: 'md' }}
        isCentered
      >
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>Add Sub Todo</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl isRequired isInvalid={!!errors.title}>
              <FormLabel htmlFor="title">Title</FormLabel>
              <Input
                id="title"
                {...register('title', {
                  required: 'Title is required.',
                })}
                placeholder="Title"
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
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Save
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default AddSubTodo;

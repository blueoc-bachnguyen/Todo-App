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
} from "@chakra-ui/react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { type SubmitHandler, useForm } from "react-hook-form";

import {
  type ApiError,
  type TodoPublic,
  type TodoUpdate,
  TodosService,
  type UserPublic,
} from "../../client";
import useCustomToast from "../../hooks/useCustomToast";
import { handleError } from "../../utils";

interface EditTodoProps {
  todo: TodoPublic;
  isOpen: boolean;
  onClose: () => void;
}

const EditTodos = ({ todo, isOpen, onClose }: EditTodoProps) => {
  const queryClient = useQueryClient();
  const showToast = useCustomToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors, isDirty },
  } = useForm<TodoUpdate>({
    mode: 'onBlur',
    criteriaMode: 'all',
    defaultValues: todo,
  });


  function getCollaboratorsQueryOptions(todoId: string) {
    return {
      queryFn: () => TodosService.ListCollaboratorsFromTodo({ todo_id: todoId }),
      queryKey: ["todos", { todoId }],
    }
  }

  const { isLoading : isCollaboratorsLoading ,data : collaborators, isError  } = useQuery(getCollaboratorsQueryOptions(todo.id))

  // console.log(collaborators)


  const mutation = useMutation({
    mutationFn: (data: TodoUpdate) =>
      TodosService.updateTodo({ id: todo.id, requestBody: data }),
    onSuccess: () => {
      showToast('Success!', 'Task updated successfully.', 'success');
      onClose();
    },
    onError: (err: ApiError) => {
      handleError(err, showToast);
    },
    onSettled: () => {
      queryClient.setQueryData(['todos'], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: oldData.data.map((todo: any) =>
            todo.id === todo.id ? { ...todo } : todo
          ),
        };
      });
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  const onSubmit: SubmitHandler<TodoUpdate> = async (data) => {
    mutation.mutate(data);
  };

  const onCancel = () => {
    reset();
    onClose();
  };

  function getRemoveCollaboratorMutationOptions(todoId: string, queryClient: any, showToast: any) {
    return {
      mutationFn: (collaboratorId: string) =>
        TodosService.removeCollaboratorFromTodo({
          todo_id: todoId,
          collaborator_user_id: collaboratorId,
        }),
      onSuccess: () => {
        showToast("Success!", "Collaborator removed successfully.", "success");
        queryClient.invalidateQueries(["additionalData", { todoId }]);
      },
      onError: (err: ApiError) => {
        handleError(err, showToast);
      },
    };
  }

  const removeCollaboratorMutation = useMutation(
    getRemoveCollaboratorMutationOptions(todo.id, queryClient, showToast)
  );

  const handleRemoveCollaborator = (collaboratorId: string) => {
    removeCollaboratorMutation.mutate(collaboratorId);
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
          <ModalHeader>Edit Task</ModalHeader>
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
            
            <FormControl mt={6}>
            
            <FormControl mt={6}>
            <FormLabel>Collaborators</FormLabel>
            {isCollaboratorsLoading ? (
              <p>Loading collaborators...</p>
            ) : Array.isArray(collaborators) && collaborators.length > 0 ? (
              <ul>
                {collaborators.map((collaborator: UserPublic) => (
                  <li key={collaborator.id} style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ flexGrow: 1 }}>
                      {collaborator.full_name} ({collaborator.email})
                    </span>
                    <Button
                      size="xs"
                      colorScheme="red"
                      ml={2}
                      onClick={() => handleRemoveCollaborator(collaborator.id)}
                    >
                      X
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No collaborators found.</p>
            )}
              </FormControl>

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

export default EditTodos;

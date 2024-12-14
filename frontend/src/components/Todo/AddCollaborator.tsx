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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type SubmitHandler, useForm } from "react-hook-form";

import {
  type ApiError,
  TodosService,
} from "../../client";
import useCustomToast from "../../hooks/useCustomToast";
import { handleError } from "../../utils";

interface InviteCollaboratorsProps {
  isOpen: boolean;
  onClose: () => void;
  todo_id: string
}

const InviteCollaborators = ({ todo_id, isOpen, onClose }: InviteCollaboratorsProps) => {
  const queryClient = useQueryClient();
  const showToast = useCustomToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<{ invite_code: string }>({
    mode: "onBlur",
    criteriaMode: "all",
  });

  // Mutation để gửi lời mời cộng tác viên
  const mutation = useMutation({
    mutationFn: (data: {
      invite_code: string;
      todo_id: string;
    }) =>
      TodosService.inviteCollaborator(data), // Gọi API để mời cộng tác viên
    onSuccess: () => {
      showToast("Success!", "Added collaborator successfully.", "success"); // Hiển thị toast thành công
      onClose();
      reset(); // Reset form sau khi thêm cộng tác viên thành công
    },
    onError: (err: ApiError) => {
      handleError(err, showToast); // Xử lý lỗi và hiển thị thông báo lỗi
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] }); // Invalidates the todos cache để cập nhật lại danh sách
    },
  });

  // Hàm xử lý khi submit form
  const onSubmit: SubmitHandler<{ invite_code: string }> = async (data) => {

    
    mutation.mutate({ invite_code: data.invite_code, todo_id: todo_id }); // Gửi request với invite code và todoId
  };

  // Hàm xử lý khi bấm nút Cancel
  const onCancel = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={{ base: "sm", md: "md" }}
      isCentered
    >
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit(onSubmit)}>
        <ModalHeader>Invite Collaborators</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <FormControl isInvalid={!!errors.invite_code}>
            <FormLabel htmlFor="invite_code">Invite Code</FormLabel>
            <Input
              id="invite_code"
              type="text"
              {...register("invite_code", { required: "Invite code is required" })}
            />
            {errors.invite_code && (
              <FormErrorMessage>{errors.invite_code.message}</FormErrorMessage>
            )}
          </FormControl>
        </ModalBody>
        <ModalFooter gap={3}>
          <Button variant="primary" type="submit" isLoading={isSubmitting}>
            Save
          </Button>
          <Button onClick={onCancel}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default InviteCollaborators;

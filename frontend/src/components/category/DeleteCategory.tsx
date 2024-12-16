import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
} from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import useCustomToast from "../../hooks/useCustomToast";
import axios from "axios";

const DeleteCategory = ({ id, isOpen, onClose, currentPage, setCurrentPage }: any) => {
  const queryClient = useQueryClient();
  const showToast = useCustomToast();
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const mutation = useMutation({
    mutationFn: async () => {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/v1/categories/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        })
      } catch (error) {
         showToast(
        "An error occurred.",
        `An error occurred while deleting the category.`,
        "error"
      );
      }
    },
    onSuccess: async () => {
      showToast(
        "Success",
        `Category was deleted successfully.`,
        "success"
      );
      // queryClient.invalidateQueries({
      //   queryKey: ["cats"],
      // });
      queryClient.invalidateQueries({
        queryKey: ["cats"], 
      });
      onClose();
    },
    
  });

  const handleDelete = async (e : any) => {
    e.preventDefault();
    mutation.mutate();
    setCurrentPage(1)
  };

  return (
    <>
      <AlertDialog
        isCentered
        isOpen={isOpen}
        onClose={onClose}
        leastDestructiveRef={cancelRef}
        size={{ base: "sm", md: "md" }}
      >
        <AlertDialogOverlay>
          <AlertDialogContent as="form" onSubmit={handleDelete}>
            <AlertDialogHeader>Delete </AlertDialogHeader>

            <AlertDialogBody>
             
              Are you sure? You will not be able to undo this action.
            </AlertDialogBody>

            <AlertDialogFooter gap={3}>
              <Button variant="danger" type="submit" >
                Delete
              </Button>
              <Button
                ref={cancelRef}
                onClick={onClose}
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

export default DeleteCategory;

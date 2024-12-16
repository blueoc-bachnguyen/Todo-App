import {
  Button,
  FormControl,
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

import {
  type ApiError,

} from '../../client';
import useCustomToast from '../../hooks/useCustomToast';
import { handleError } from '../../utils';
import { useEffect, useState } from 'react';
import axios from 'axios';

interface EditCategoryProps {
  cat: any;
  isOpen: boolean;
  onClose: () => void;
}

const EditCategory = ({ cat, isOpen, onClose }: EditCategoryProps) => {
  const queryClient = useQueryClient();
  const showToast = useCustomToast();
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')

  const mutation = useMutation({
    mutationFn: async() => {
      try {
        const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/v1/categories/${cat.id}`, {
          title: title,
          desc: desc,
        }, {
          headers: {
            'Authorization':`Bearer ${localStorage.getItem('access_token')}`
          }
        })
      } catch (error) {
        
      }
    },
    onSuccess: () => {
      showToast('Success!', 'Task updated successfully.', 'success');
      onClose();
    },
    onError: (err: ApiError) => {
      handleError(err, showToast);
    },
    onSettled: () => {
      queryClient.setQueryData(['cats'], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: oldData.data.map((cat: any) =>
            cat.id === cat.id ? { ...cat } : cat
          ),
        };
      });
      queryClient.invalidateQueries({ queryKey: ['cats'] });
    },
  });

  const handleSubmit = async (e:any) => {
    e.preventDefault()
    mutation.mutate();
  };

  const onCancel = () => {
    onClose();
  };


  useEffect(() => {
    setTitle(cat.title)
    setDesc(cat.desc)
  },[])

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size={{ base: 'sm', md: 'md' }}
        isCentered
      >
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleSubmit}>
          <ModalHeader>Edit Task</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl >
              <FormLabel htmlFor="title">Title</FormLabel>
              <Input
                id="title"
                value={title}
                onChange={(e)=> setTitle(e.target.value)}
                type="text"
              />
             
            </FormControl>
            <FormControl mt={4}>
              <FormLabel htmlFor="desc">Description</FormLabel>
              <Input
                id="desc"
                value={desc}
                onChange={(e)=> setDesc(e.target.value)}
                placeholder="Description"
                type="text"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter gap={3}>
            <Button
              variant="primary"
              type="submit"
             
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

export default EditCategory;

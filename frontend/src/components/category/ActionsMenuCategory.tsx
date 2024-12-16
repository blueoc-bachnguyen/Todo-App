import {
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  useDisclosure,
} from '@chakra-ui/react';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { FiEdit, FiTrash } from 'react-icons/fi';

import DeleteCategory from '../../components/category/DeleteCategory.tsx';
import EditCategory from "./EditCategory.tsx"

const ActionsMenuCategory = ({ value,currentPage, setCurrentPage }:any ) => {
  const deleteModal = useDisclosure();
  const editCategoryModal = useDisclosure();

  return (
    <>
      <Menu>
        <MenuButton
          as={Button}
          rightIcon={<BsThreeDotsVertical />}
          variant="unstyled"
        />
        <MenuList>
          <MenuItem
            onClick={editCategoryModal.onOpen}
            icon={<FiEdit fontSize="16px" />}
          >
            Edit category
          </MenuItem>
         
          <MenuItem
            onClick={deleteModal.onOpen}
            icon={<FiTrash fontSize="16px" />}
            color="ui.danger"
          >
            Delete Category
          </MenuItem>
        </MenuList>
        
        <DeleteCategory
          id={value.id}
          currentPage={currentPage}
          isOpen={deleteModal.isOpen}
          setCurrentPage={setCurrentPage}
          onClose={deleteModal.onClose}
              />
              <EditCategory
            cat={value }
            isOpen={editCategoryModal.isOpen}
            onClose={editCategoryModal.onClose}
          />
      </Menu>
    </>
  );
};

export default ActionsMenuCategory;

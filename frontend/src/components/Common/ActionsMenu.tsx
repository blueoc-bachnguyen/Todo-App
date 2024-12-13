import {
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  useDisclosure,
} from '@chakra-ui/react';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { FiEdit, FiPlus, FiTrash } from 'react-icons/fi';

import Delete from './DeleteAlert';
import EditUser from '../Admin/EditUser';
import EditTodos from '../todos/EditTodo';
import AddSubTodo from '../subtodos/AddSubTodo';
import type { SubTodoPublic, TodoPublic, UserPublic } from '../../client';

interface ActionsMenuProps {
  type: string;
  value: TodoPublic | UserPublic | SubTodoPublic;
  disabled?: boolean;
}

const isTodoPublic = (
  value: TodoPublic | UserPublic | SubTodoPublic
): value is TodoPublic => {
  return (value as TodoPublic).title !== undefined;
};

const ActionsMenu = ({ type, value, disabled }: ActionsMenuProps) => {
  const deleteModal = useDisclosure();
  const editUserModal = useDisclosure();
  const addSubTaskModal = useDisclosure();

  return (
    <>
      <Menu>
        <MenuButton
          isDisabled={disabled}
          as={Button}
          rightIcon={<BsThreeDotsVertical />}
          variant="unstyled"
        />
        <MenuList>
          <MenuItem
            onClick={editUserModal.onOpen}
            icon={<FiEdit fontSize="16px" />}
          >
            Edit {type}
          </MenuItem>
          {isTodoPublic(value) && (
            <>
              <MenuItem
                onClick={addSubTaskModal.onOpen}
                icon={<FiPlus fontSize="16px" />}
              >
                Add SubTodo
                <AddSubTodo
                  isOpen={addSubTaskModal.isOpen}
                  onClose={addSubTaskModal.onClose}
                  todoId={value.id}
                />
              </MenuItem>
            </>
          )}
          <MenuItem
            onClick={deleteModal.onOpen}
            icon={<FiTrash fontSize="16px" />}
            color="ui.danger"
          >
            Delete {type}
          </MenuItem>
        </MenuList>
        {type === 'User' ? (
          <EditUser
            user={value as UserPublic}
            isOpen={editUserModal.isOpen}
            onClose={editUserModal.onClose}
          />
        ) : (
          <EditTodos
            todo={value as TodoPublic}
            isOpen={editUserModal.isOpen}
            onClose={editUserModal.onClose}
          />
        )}
        <Delete
          type={type}
          id={value.id}
          isOpen={deleteModal.isOpen}
          onClose={deleteModal.onClose}
        />
      </Menu>
    </>
  );
};

export default ActionsMenu;

import {
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  useDisclosure,
} from "@chakra-ui/react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FiEdit, FiPlus, FiTrash, FiUsers } from "react-icons/fi";

import { 
  type TodoPublic, 
  type UserPublic, 
  type CollaboratorInformation, 
  type SubTodoPublic, 
  TodosService 
} from "../../client";
import EditUser from "../Admin/EditUser";
import EditTodos from "../todos/EditTodos";
import Delete from "./DeleteAlert";
import InviteCollaborators from "../todos/AddCollaborator";
import AddSubTodo from "../subtodos/AddSubTodo";
import { useQuery } from "@tanstack/react-query";

interface ActionsMenuProps {
  type: string;
  value: TodoPublic | UserPublic | SubTodoPublic;
  disabled?: boolean;
}

const ActionsMenu = ({ type, value, disabled }: ActionsMenuProps) => {
  const editUserModal = useDisclosure()
  const deleteModal = useDisclosure()
  const InviteCollaboratorsModal = useDisclosure()
  const addSubTaskModal = useDisclosure();


const isTodoPublic = (
  value: TodoPublic | UserPublic | SubTodoPublic
): value is TodoPublic => {
  return (value as TodoPublic).title !== undefined;
};


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

          <MenuItem
            onClick={InviteCollaboratorsModal.onOpen}
            icon={<FiUsers fontSize="16px" />}
            color="unstyled"
          >
            Add collaborators
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
      
      <InviteCollaborators
        todo_id={value.id}
        isOpen={InviteCollaboratorsModal.isOpen}
        onClose={InviteCollaboratorsModal.onClose}/>
    </>
  );
};

export default ActionsMenu;

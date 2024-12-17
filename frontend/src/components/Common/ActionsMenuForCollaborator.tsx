import {
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  useDisclosure,
} from "@chakra-ui/react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FiEdit, FiLogOut, FiPlus, FiTrash, FiUsers } from "react-icons/fi";

import { 
  type TodoPublic, 
  type UserPublic, 
  type CollaboratorInformation, 
  type SubTodoPublic, 
  TodosService 
} from "../../client";
import EditUser from "../Admin/EditUser";
import EditTodos from "../Todo/EditTodo";
// import Delete from "./DeleteAlert";
import InviteCollaborators from "../Todo/AddCollaborator";
import AddSubTodo from "../SubTodo/AddSubTodo";
import { useQuery } from "@tanstack/react-query";
import Delete from "../Todo/QuitCollaborate"

interface ActionsMenuForCollaboratorProps {
  type: string
  value: TodoPublic | UserPublic
  disabled?: boolean
}

const ActionsMenuForCollaborator = ({ type, value, disabled }: ActionsMenuForCollaboratorProps) => {
  const editUserModal = useDisclosure()
  const QuitCollaborate = useDisclosure()
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
            onClick={QuitCollaborate.onOpen}
            icon={<FiLogOut fontSize="16px" />}
            color="ui.danger"
          >
            Quit {type}
          </MenuItem>
        </MenuList>
        {type === "User" ? (
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
          isOpen={QuitCollaborate.isOpen}
          onClose={QuitCollaborate.onClose}
        />
      </Menu>
      
      <InviteCollaborators
        todo_id={value.id}
        isOpen={InviteCollaboratorsModal.isOpen}
        onClose={InviteCollaboratorsModal.onClose}/>
    </>
  )
}

export default ActionsMenuForCollaborator

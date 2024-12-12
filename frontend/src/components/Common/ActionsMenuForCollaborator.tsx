import {
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  useDisclosure,
} from "@chakra-ui/react"
import {  BsThreeDotsVertical } from "react-icons/bs"
import {FiEdit, FiLogOut, FiPlus, FiTrash, FiUsers } from "react-icons/fi"

import type { TodoPublic, UserPublic } from "../../client"
import EditUser from "../Admin/EditUser"
import Edittodos from "../todos/Edittodos"
// import Delete from "./DeleteAlert"
import InviteCollaborators from "../todos/AddCollaborator"
import Delete from "../todos/QuitCollaborate"

interface ActionsMenuForCollaboratorProps {
  type: string
  value: TodoPublic | UserPublic
  disabled?: boolean
}

const ActionsMenuForCollaborator = ({ type, value, disabled }: ActionsMenuForCollaboratorProps) => {
  const editUserModal = useDisclosure()
  const QuitCollaborate = useDisclosure()
  const InviteCollaboratorsModal = useDisclosure()
  const addSubtask = () => {
    console.log("add subtask")
  }
  
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
            onClick={addSubtask}
            icon={<FiPlus fontSize="16px" />}
          >
            Add Subtask
          </MenuItem>
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
          <Edittodos
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

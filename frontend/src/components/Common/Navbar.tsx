import { Flex, Button, Icon, useDisclosure } from "@chakra-ui/react";
import { FaPlus } from "react-icons/fa";
import SearchComponent from "../Todo/SearchTodo";
import { Menu, MenuButton, MenuList, MenuItem } from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";

interface NavbarProps {
  type: string;
  addModalAs: React.ComponentType | React.ElementType;
  onSearch: (search: string) => void;
  search: string;
  handleChangeStatusForSelected: (status: string) => void;
}

const Navbar = ({
  addModalAs,
  onSearch,
  search,
  handleChangeStatusForSelected,
}: NavbarProps) => {
  const addModal = useDisclosure();
  const AddModal = addModalAs;

  return (
    <Flex
      py={5}
      gap={4}
      align="center"
      flexWrap="wrap"
      margin="20px 0px 10px 0px"
    >
      {/* Button to open Add Todo modal */}
      <Button
        variant="primary"
        gap={1}
        fontSize={{ base: "sm", md: "inherit" }}
        onClick={addModal.onOpen}
      >
        <Icon as={FaPlus} /> Add Todo
      </Button>
      <AddModal isOpen={addModal.isOpen} onClose={addModal.onClose} />

      {/* Search component */}
      <SearchComponent onSearch={onSearch} search={search} />
      <Menu>
        <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
          Change Status
        </MenuButton>
        <MenuList>
          <MenuItem
            onClick={() => handleChangeStatusForSelected("in_progress")}
            color="blue.500"
            fontWeight="650"
          >
            In Progress
          </MenuItem>
          <MenuItem
            onClick={() => handleChangeStatusForSelected("completed")}
            color="green.500"
            fontWeight="650"
          >
            Completed
          </MenuItem>
          <MenuItem
            onClick={() => handleChangeStatusForSelected("pending")}
            color="red.500"
            fontWeight="650"
          >
            Pending
          </MenuItem>
        </MenuList>
      </Menu>
    </Flex>
  );
};

export default Navbar;

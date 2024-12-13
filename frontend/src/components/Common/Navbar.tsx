import { Flex, Button, Icon, useDisclosure } from '@chakra-ui/react';
import { FaPlus } from 'react-icons/fa';
import SearchComponent from '../Todo/SearchTodo';

interface NavbarProps {
  type: string;
  addModalAs: React.ComponentType | React.ElementType;
  onSearch: (search: string) => void;
  search: string;
}

const Navbar = ({ addModalAs, onSearch, search }: NavbarProps) => {
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
        fontSize={{ base: 'sm', md: 'inherit' }}
        onClick={addModal.onOpen}
      >
        <Icon as={FaPlus} /> Add Todo
      </Button>
      <AddModal isOpen={addModal.isOpen} onClose={addModal.onClose} />

      {/* Search component */}
      <SearchComponent onSearch={onSearch} search={search} />
    </Flex>
  );
};

export default Navbar;

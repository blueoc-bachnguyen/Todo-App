import {
  Box,
  Menu,
  Avatar,
  MenuItem,
  MenuList,
  IconButton,
  MenuButton,
} from '@chakra-ui/react';
import { Link } from '@tanstack/react-router';
import { FaUserAstronaut } from 'react-icons/fa';
import { FiLogOut, FiUser } from 'react-icons/fi';

import useAuth from '../../hooks/useAuth';

const UserMenu = () => {
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    logout();
  };

  return (
    <>
      {/* Desktop */}
      <Box
        display={{ base: 'none', md: 'block' }}
        position="fixed"
        top={4}
        right={4}
      >
        <Menu>
          <MenuButton
            as={IconButton}
            aria-label="Options"
            icon={<Avatar name={user?.full_name || undefined} />}
            bg="ui.main"
            isRound
            data-testid="user-menu"
          />
          <MenuList>
            <MenuItem icon={<FiUser fontSize="18px" />} as={Link} to="settings">
              My profile
            </MenuItem>
            <MenuItem
              icon={<FiLogOut fontSize="18px" />}
              onClick={handleLogout}
              color="ui.danger"
              fontWeight="bold"
            >
              Log out
            </MenuItem>
          </MenuList>
        </Menu>
      </Box>
    </>
  );
};

export default UserMenu;

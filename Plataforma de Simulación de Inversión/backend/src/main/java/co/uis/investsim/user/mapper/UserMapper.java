package co.uis.investsim.user.mapper;

import co.uis.investsim.user.dto.UserCreateDTO;
import co.uis.investsim.user.dto.UserDTO;
import co.uis.investsim.user.dto.UserUpdateDTO;
import co.uis.investsim.user.entity.UserEntity;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserDTO toDto(UserEntity entity) {
        UserDTO dto = new UserDTO();
        dto.setId(entity.getId());
        dto.setEmail(entity.getEmail());
        dto.setFirstName(entity.getFirstName());
        dto.setLastName(entity.getLastName());
        dto.setRole(entity.getRole());
        dto.setInitialBalance(entity.getInitialBalance());
        dto.setAvailableBalance(entity.getAvailableBalance());
        dto.setActive(entity.getActive());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }

    public UserEntity toEntity(UserCreateDTO dto) {
        UserEntity entity = new UserEntity();
        entity.setEmail(dto.getEmail().trim().toLowerCase());
        entity.setPassword(dto.getPassword());
        entity.setFirstName(dto.getFirstName().trim());
        entity.setLastName(dto.getLastName().trim());
        return entity;
    }

    public UserEntity toEntity(UserUpdateDTO dto) {
        UserEntity entity = new UserEntity();
        entity.setEmail(dto.getEmail().trim().toLowerCase());
        entity.setFirstName(dto.getFirstName().trim());
        entity.setLastName(dto.getLastName().trim());
        return entity;
    }

    public void applyUpdate(UserEntity entity, UserUpdateDTO dto) {
        entity.setEmail(dto.getEmail().trim().toLowerCase());
        entity.setFirstName(dto.getFirstName().trim());
        entity.setLastName(dto.getLastName().trim());
    }
}

package com.example.thichdulich.service;

import com.example.thichdulich.dto.UserDTO;
import com.example.thichdulich.entity.Booking;
import com.example.thichdulich.entity.User;
import com.example.thichdulich.mapper.DtoMapper;
import com.example.thichdulich.repository.BookingRepository;
import com.example.thichdulich.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public UserDTO getUserById(String id) {
        return convertToDTO(userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng")));
    }

    public UserDTO updateUserProfile(String userId, UserDTO userDTO) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        if (userDTO.getName() != null) user.setName(userDTO.getName());
        if (userDTO.getPhone() != null) user.setPhone(userDTO.getPhone());
        if (userDTO.getAvatar() != null) user.setAvatar(userDTO.getAvatar());
        return convertToDTO(userRepository.save(user));
    }

    public void changePassword(String userId, String oldPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Mật khẩu hiện tại không chính xác");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public UserDTO getUserByEmail(String email) {
        return convertToDTO(userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng")));
    }

    private UserDTO convertToDTO(User user) {
        UserDTO dto = DtoMapper.toUserDTO(user);
        Long bookingCount = bookingRepository.countByUserAndStatusNot(user, Booking.BookingStatus.cancelled);
        dto.setTotalBookings(bookingCount);
        return dto;
    }
}

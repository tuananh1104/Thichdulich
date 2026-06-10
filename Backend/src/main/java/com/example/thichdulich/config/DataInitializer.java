package com.example.thichdulich.config;

import com.example.thichdulich.entity.Booking;
import com.example.thichdulich.entity.DepartureSchedule;
import com.example.thichdulich.entity.Destination;
import com.example.thichdulich.entity.Provider;
import com.example.thichdulich.entity.Tour;
import com.example.thichdulich.entity.TourReview;
import com.example.thichdulich.entity.User;
import com.example.thichdulich.repository.BookingRepository;
import com.example.thichdulich.repository.DepartureScheduleRepository;
import com.example.thichdulich.repository.DestinationRepository;
import com.example.thichdulich.repository.ProviderRepository;
import com.example.thichdulich.repository.TourRepository;
import com.example.thichdulich.repository.TourReviewRepository;
import com.example.thichdulich.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Configuration
public class DataInitializer {
    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);
    private static final ObjectMapper JSON = new ObjectMapper();

    @Bean
    public CommandLineRunner initializeData(
            UserRepository userRepository,
            ProviderRepository providerRepository,
            DestinationRepository destinationRepository,
            TourRepository tourRepository,
            DepartureScheduleRepository scheduleRepository,
            BookingRepository bookingRepository,
            TourReviewRepository reviewRepository,
            JdbcTemplate jdbcTemplate,
            PasswordEncoder passwordEncoder,
            @Value("${app.data.seed-demo:false}") boolean seedDemoData,
            @Value("${app.data.drop-legacy-tables:false}") boolean dropLegacyTables) {
        return args -> {
            ensureAuthSchema(jdbcTemplate);
            ensureTourTypeSchema(jdbcTemplate);
            ensureTourCategorySchema(jdbcTemplate);
            ensureOnDemandTourSchema(jdbcTemplate);
            ensurePaymentSchema(jdbcTemplate);
            if (dropLegacyTables) {
                dropLegacyTables(jdbcTemplate);
            }
            ensureReportSchema(jdbcTemplate);
            ensureReviewSchema(jdbcTemplate);
            removeEnglishContentColumns(jdbcTemplate);
            ensureDatabaseOptimizationSchema(jdbcTemplate);

            if (!seedDemoData) {
                log.info("Demo data seeding is disabled. Set app.data.seed-demo=true to seed development accounts and tours.");
                return;
            }

            User admin = userRepository.findById("admin-0001-0000-0000-000000000001")
                    .orElseGet(() -> {
                        User user = new User();
                        user.setId("admin-0001-0000-0000-000000000001");
                        user.setName("Admin Thích Du Lịch");
                        user.setEmail("admin@demo.com");
                        user.setPasswordHash(passwordEncoder.encode("admin123"));
                        user.setPhone("0900000000");
                        user.setRole(User.UserRole.admin);
                        user.setProvider(User.AuthProvider.LOCAL);
                        user.setEnabled(true);
                        return userRepository.save(user);
                    });

            User providerUser = userRepository.findById("prov-user-001-0000-000000000001")
                    .orElseGet(() -> {
                        User user = new User();
                        user.setId("prov-user-001-0000-000000000001");
                        user.setName("Công ty Du lịch Bắc Việt");
                        user.setEmail("provider@demo.com");
                        user.setPasswordHash(passwordEncoder.encode("demo123"));
                        user.setPhone("02438257000");
                        user.setRole(User.UserRole.provider);
                        user.setProvider(User.AuthProvider.LOCAL);
                        user.setEnabled(true);
                        return userRepository.save(user);
                    });

            User demoUser = userRepository.findById("user-0001-0000-0000-000000000001")
                    .orElseGet(() -> {
                        User user = new User();
                        user.setId("user-0001-0000-0000-000000000001");
                        user.setName("Nguyễn Văn A");
                        user.setEmail("user@demo.com");
                        user.setPasswordHash(passwordEncoder.encode("demo123"));
                        user.setPhone("0901234567");
                        user.setRole(User.UserRole.user);
                        user.setProvider(User.AuthProvider.LOCAL);
                        user.setEnabled(true);
                        return userRepository.save(user);
                    });

            List<User> travelers = List.of(
                    demoUser,
                    user(userRepository, passwordEncoder, "user-traveler-002", "Trần Minh Anh", "minhanh.travel@demo.com", "0912345678"),
                    user(userRepository, passwordEncoder, "user-traveler-003", "Lê Hoàng Nam", "hoangnam.travel@demo.com", "0923456789"),
                    user(userRepository, passwordEncoder, "user-traveler-004", "Phạm Thu Hà", "thuha.travel@demo.com", "0934567890"),
                    user(userRepository, passwordEncoder, "user-traveler-005", "Đặng Quốc Huy", "quochuy.travel@demo.com", "0945678901"),
                    user(userRepository, passwordEncoder, "user-traveler-006", "Vũ Ngọc Linh", "ngoclinh.travel@demo.com", "0956789012"),
                    user(userRepository, passwordEncoder, "user-traveler-007", "Bùi Gia Bảo", "giabao.travel@demo.com", "0967890123"),
                    user(userRepository, passwordEncoder, "user-traveler-008", "Hoàng Mai Chi", "maichi.travel@demo.com", "0978901234"),
                    user(userRepository, passwordEncoder, "user-traveler-009", "Ngô Thanh Tùng", "thanhtung.travel@demo.com", "0989012345"),
                    user(userRepository, passwordEncoder, "user-traveler-010", "Đỗ An Nhiên", "annhien.travel@demo.com", "0990123456")
            );

            Provider provider = providerRepository.findById("prov-0001-0000-0000-000000000001")
                    .orElseGet(() -> {
                        Provider item = new Provider();
                        item.setId("prov-0001-0000-0000-000000000001");
                        item.setUser(providerUser);
                        item.setCompanyName("Công ty Du lịch Bắc Việt");
                        item.setTaxCode("0123456789");
                        item.setPhone("02438257000");
                        item.setLicenseNumber("01-001/LHND-TCDL");
                        item.setStatus(Provider.ProviderStatus.approved);
                        item.setIsVerified(true);
                        item.setJoinedDate(LocalDate.of(2024, 1, 10));
                        return providerRepository.save(item);
                    });
            Destination halong = destination(destinationRepository, "dest-ha-long", "Vịnh Hạ Long", "Di sản thiên nhiên thế giới với đảo đá vôi và du thuyền nghỉ đêm.", "https://images.unsplash.com/photo-1528127269322-539801943592?w=1000&h=700&fit=crop", "Bắc");
            Destination hoian = destination(destinationRepository, "dest-hoi-an", "Phố cổ Hội An", "Phố cổ ven sông với đèn lồng, nhà cổ và làng nghề.", "https://images.unsplash.com/photo-1562005094-c724030f99bd?w=1000&h=700&fit=crop", "Trung");
            Destination danang = destination(destinationRepository, "dest-da-nang", "Đà Nẵng", "Thành phố biển với Bà Nà Hills, Cầu Vàng và biển Mỹ Khê.", "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1000&h=700&fit=crop", "Trung");
            Destination dalat = destination(destinationRepository, "dest-da-lat", "Đà Lạt", "Thành phố ngàn hoa với thác, hồ và khí hậu mát mẻ.", "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1000&h=700&fit=crop", "Trung");
            Destination sapa = destination(destinationRepository, "dest-sapa", "Sapa", "Thị trấn vùng cao với Fansipan, ruộng bậc thang và bản làng.", "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1000&h=700&fit=crop", "Bắc");
            Destination phuquoc = destination(destinationRepository, "dest-phu-quoc", "Phú Quốc", "Đảo ngọc với bãi biển trong xanh và tour lặn san hô.", "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&h=700&fit=crop", "Nam");
            Destination nhatrang = destination(destinationRepository, "dest-nha-trang", "Nha Trang", "Thành phố biển với vịnh đẹp, đảo và tắm bùn khoáng.", "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1000&h=700&fit=crop", "Trung");
            Destination mekong = destination(destinationRepository, "dest-mekong", "Miền Tây sông nước", "Chợ nổi, miệt vườn và đời sống sông nước Nam Bộ.", "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1000&h=700&fit=crop", "Nam");
            Destination hanoi = destination(destinationRepository, "dest-ha-noi", "Hà Nội", "Thủ đô nghìn năm văn hiến với phố cổ, hồ Gươm, làng nghề ven đô và ẩm thực đường phố.", "https://images.unsplash.com/photo-1528127269322-539801943592?w=1000&h=700&fit=crop", "Bắc");
            Destination hue = destination(destinationRepository, "dest-hue", "Huế", "Cố đô bên sông Hương với Đại Nội, lăng tẩm, nhà vườn và ẩm thực cung đình.", "https://images.unsplash.com/photo-1562005094-c724030f99bd?w=1000&h=700&fit=crop", "Trung");
            Destination quynhon = destination(destinationRepository, "dest-quy-nhon", "Quy Nhơn", "Thành phố biển yên bình với Kỳ Co, Eo Gió, Cù Lao Xanh và hải sản tươi.", "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&h=700&fit=crop", "Trung");
            Destination hagiang = destination(destinationRepository, "dest-ha-giang", "Hà Giang", "Cao nguyên đá Đồng Văn, đèo Mã Pì Lèng, sông Nho Quế và bản làng vùng cao.", "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1000&h=700&fit=crop", "Bắc");
            Destination condao = destination(destinationRepository, "dest-con-dao", "Côn Đảo", "Quần đảo hoang sơ với biển xanh, rừng nguyên sinh, di tích lịch sử và không gian nghỉ dưỡng yên tĩnh.", "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1000&h=700&fit=crop", "Nam");

            tour(tourRepository, provider, admin, halong, "tour-ha-long-3d", "Tour Vịnh Hạ Long 3 ngày 2 đêm", "Tour Vịnh Hạ Long 3 ngày 2 đêm", "Du thuyền Hạ Long, hang Sửng Sốt, đảo Titop, kayak và bữa tối trên vịnh.", "Du thuyền Hạ Long, hang Sửng Sốt, đảo Titop, kayak và bữa tối trên vịnh.", "Quảng Ninh", Tour.TourType.nature, 3, 5_999_000L, 4_499_000L, 4.8, 150, "https://images.unsplash.com/photo-1528127269322-539801943592?w=1000&h=700&fit=crop");
            tour(tourRepository, provider, admin, hoian, "tour-hoi-an-2d", "Tour Hội An - Đà Nẵng 2 ngày", "Tour Hội An - Đà Nẵng 2 ngày", "Phố cổ Hội An, làng gốm Thanh Hà, biển An Bàng và ẩm thực địa phương.", "Phố cổ Hội An, làng gốm Thanh Hà, biển An Bàng và ẩm thực địa phương.", "Quảng Nam", Tour.TourType.cultural, 2, 3_799_000L, 2_899_000L, 4.7, 96, "https://images.unsplash.com/photo-1562005094-c724030f99bd?w=1000&h=700&fit=crop");
            tour(tourRepository, provider, admin, danang, "tour-da-nang-ba-na-3d", "Đà Nẵng - Bà Nà Hills 3 ngày", "Đà Nẵng - Bà Nà Hills 3 ngày", "Cầu Vàng, Bà Nà Hills, biển Mỹ Khê, bán đảo Sơn Trà và chợ đêm.", "Cầu Vàng, Bà Nà Hills, biển Mỹ Khê, bán đảo Sơn Trà và chợ đêm.", "Đà Nẵng", Tour.TourType.city, 3, 4_899_000L, 3_699_000L, 4.6, 118, "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1000&h=700&fit=crop");
            tour(tourRepository, provider, admin, sapa, "tour-sapa-fansipan-3d", "Sapa - Fansipan 3 ngày", "Sapa - Fansipan 3 ngày", "Chinh phục Fansipan, bản Cát Cát, ruộng bậc thang và chợ đêm Sapa.", "Chinh phục Fansipan, bản Cát Cát, ruộng bậc thang và chợ đêm Sapa.", "Lào Cai", Tour.TourType.adventure, 3, 4_299_000L, 3_199_000L, 4.8, 142, "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1000&h=700&fit=crop");
            tour(tourRepository, provider, admin, phuquoc, "tour-phu-quoc-4d", "Phú Quốc nghỉ dưỡng 4 ngày", "Phú Quốc nghỉ dưỡng 4 ngày", "Bãi Sao, Hòn Thơm, lặn ngắm san hô, chợ đêm và hoàng hôn Sunset Town.", "Bãi Sao, Hòn Thơm, lặn ngắm san hô, chợ đêm và hoàng hôn Sunset Town.", "Kiên Giang", Tour.TourType.beach, 4, 6_499_000L, 4_999_000L, 4.9, 210, "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&h=700&fit=crop");
            tour(tourRepository, provider, admin, nhatrang, "tour-nha-trang-island-3d", "Nha Trang tour đảo 3 ngày", "Nha Trang tour đảo 3 ngày", "Vịnh Nha Trang, Hòn Mun, lặn biển, tắm bùn khoáng và hải sản.", "Vịnh Nha Trang, Hòn Mun, lặn biển, tắm bùn khoáng và hải sản.", "Khánh Hòa", Tour.TourType.beach, 3, 4_599_000L, 3_499_000L, 4.6, 132, "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1000&h=700&fit=crop");
            tour(tourRepository, provider, admin, mekong, "tour-mekong-can-tho-2d", "Miền Tây - Cần Thơ 2 ngày", "Miền Tây - Cần Thơ 2 ngày", "Chợ nổi Cái Răng, vườn trái cây, thuyền sông và ẩm thực miền Tây.", "Chợ nổi Cái Răng, vườn trái cây, thuyền sông và ẩm thực miền Tây.", "Cần Thơ", Tour.TourType.nature, 2, 2_499_000L, 1_899_000L, 4.5, 86, "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1000&h=700&fit=crop");

            tour(tourRepository, provider, admin, halong, "tour-yen-tu-ha-long-3d", "Yên Tử - Hạ Long 3 ngày", "Yên Tử - Hạ Long 3 ngày", "Kết hợp hành hương Yên Tử, phố cổ Hạ Long và trải nghiệm vịnh.", "Kết hợp hành hương Yên Tử, phố cổ Hạ Long và trải nghiệm vịnh.", "Quảng Ninh", Tour.TourType.cultural, 3, 4_899_000L, 3_699_000L, 4.5, 88, "https://images.unsplash.com/photo-1528127269322-539801943592?w=1000&h=700&fit=crop");
            tour(tourRepository, provider, admin, dalat, "tour-da-lat-farm-3d", "Đà Lạt nông trại và săn mây 3 ngày", "Đà Lạt nông trại và săn mây 3 ngày", "Săn mây Cầu Đất, nông trại rau hoa, hồ Tuyền Lâm và cà phê đặc sản.", "Săn mây Cầu Đất, nông trại rau hoa, hồ Tuyền Lâm và cà phê đặc sản.", "Lâm Đồng", Tour.TourType.mountain, 3, 3_899_000L, 2_899_000L, 4.7, 126, "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1000&h=700&fit=crop");
            tour(tourRepository, provider, admin, mekong, "tour-mekong-food-2d", "Miền Tây ẩm thực miệt vườn 2 ngày", "Miền Tây ẩm thực miệt vườn 2 ngày", "Bánh xèo, cá tai tượng, trái cây nhà vườn và lớp nấu món miền Tây.", "Bánh xèo, cá tai tượng, trái cây nhà vườn và lớp nấu món miền Tây.", "Cần Thơ", Tour.TourType.food, 2, 2_199_000L, 1_699_000L, 4.6, 93, "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1000&h=700&fit=crop");

            tour(tourRepository, provider, admin, hanoi, "tour-ha-noi-pho-co-2d", "Hà Nội phố cổ và hồ Gươm 2 ngày", "Hà Nội phố cổ và hồ Gươm 2 ngày", "Phố cổ Hà Nội, hồ Gươm, đền Ngọc Sơn, chợ Đồng Xuân và ẩm thực đêm.", "Phố cổ Hà Nội, hồ Gươm, đền Ngọc Sơn, chợ Đồng Xuân và ẩm thực đêm.", "Hà Nội", Tour.TourType.cultural, 2, 2_399_000L, 1_799_000L, 4.8, 154, "https://images.unsplash.com/photo-1528127269322-539801943592?w=1000&h=700&fit=crop");
            tour(tourRepository, provider, admin, hanoi, "tour-ha-noi-lang-nghe-1d", "Hà Nội làng nghề ven đô 1 ngày", "Hà Nội làng nghề ven đô 1 ngày", "Làng gốm Bát Tràng, làng lụa Vạn Phúc, trải nghiệm làm sản phẩm thủ công và mua đặc sản.", "Làng gốm Bát Tràng, làng lụa Vạn Phúc, trải nghiệm làm sản phẩm thủ công và mua đặc sản.", "Hà Nội", Tour.TourType.cultural, 1, 1_190_000L, 890_000L, 4.6, 81, "https://images.unsplash.com/photo-1562005094-c724030f99bd?w=1000&h=700&fit=crop");
            tour(tourRepository, provider, admin, hanoi, "tour-ha-noi-am-thuc-dem-1d", "Hà Nội ẩm thực đêm 1 ngày", "Hà Nội ẩm thực đêm 1 ngày", "Phở, bún chả, bánh cuốn, cà phê trứng và dạo phố cổ bằng xích lô.", "Phở, bún chả, bánh cuốn, cà phê trứng và dạo phố cổ bằng xích lô.", "Hà Nội", Tour.TourType.food, 1, 990_000L, 690_000L, 4.7, 116, "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1000&h=700&fit=crop");
            tour(tourRepository, provider, admin, hanoi, "tour-ha-noi-ninh-binh-3d", "Hà Nội - Ninh Bình 3 ngày", "Hà Nội - Ninh Bình 3 ngày", "Hà Nội, Tràng An, Hang Múa, chùa Bái Đính và đạp xe qua làng quê Bắc Bộ.", "Hà Nội, Tràng An, Hang Múa, chùa Bái Đính và đạp xe qua làng quê Bắc Bộ.", "Hà Nội", Tour.TourType.nature, 3, 3_890_000L, 2_890_000L, 4.8, 172, "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1000&h=700&fit=crop");

            tour(tourRepository, provider, admin, hue, "tour-hue-dai-noi-2d", "Huế Đại Nội và sông Hương 2 ngày", "Huế Đại Nội và sông Hương 2 ngày", "Đại Nội Huế, chùa Thiên Mụ, ca Huế trên sông Hương và chợ Đông Ba.", "Đại Nội Huế, chùa Thiên Mụ, ca Huế trên sông Hương và chợ Đông Ba.", "Thừa Thiên Huế", Tour.TourType.cultural, 2, 2_590_000L, 1_990_000L, 4.8, 143, "https://images.unsplash.com/photo-1562005094-c724030f99bd?w=1000&h=700&fit=crop");
            tour(tourRepository, provider, admin, hue, "tour-hue-lang-tam-1d", "Huế lăng tẩm triều Nguyễn 1 ngày", "Huế lăng tẩm triều Nguyễn 1 ngày", "Lăng Minh Mạng, lăng Khải Định, lăng Tự Đức, nhà vườn Kim Long và trà cung đình.", "Lăng Minh Mạng, lăng Khải Định, lăng Tự Đức, nhà vườn Kim Long và trà cung đình.", "Thừa Thiên Huế", Tour.TourType.cultural, 1, 1_350_000L, 990_000L, 4.7, 94, "https://images.unsplash.com/photo-1528127269322-539801943592?w=1000&h=700&fit=crop");
            tour(tourRepository, provider, admin, hue, "tour-hue-am-thuc-1d", "Huế ẩm thực cung đình 1 ngày", "Huế ẩm thực cung đình 1 ngày", "Bún bò Huế, bánh bèo, bánh khoái, chè cung đình và chợ đêm bên sông Hương.", "Bún bò Huế, bánh bèo, bánh khoái, chè cung đình và chợ đêm bên sông Hương.", "Thừa Thiên Huế", Tour.TourType.food, 1, 1_090_000L, 790_000L, 4.6, 103, "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1000&h=700&fit=crop");
            tour(tourRepository, provider, admin, hue, "tour-hue-bach-ma-3d", "Huế - Bạch Mã 3 ngày", "Huế - Bạch Mã 3 ngày", "Vườn quốc gia Bạch Mã, suối Ngũ Hồ, thác Đỗ Quyên và nghỉ dưỡng gần biển Lăng Cô.", "Vườn quốc gia Bạch Mã, suối Ngũ Hồ, thác Đỗ Quyên và nghỉ dưỡng gần biển Lăng Cô.", "Thừa Thiên Huế", Tour.TourType.nature, 3, 3_690_000L, 2_790_000L, 4.7, 88, "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1000&h=700&fit=crop");

            tour(tourRepository, provider, admin, quynhon, "tour-quy-nhon-ky-co-2d", "Quy Nhơn - Kỳ Co Eo Gió 2 ngày", "Quy Nhơn - Kỳ Co Eo Gió 2 ngày", "Kỳ Co, Eo Gió, tịnh xá Ngọc Hòa, lặn ngắm san hô và hải sản ven biển.", "Kỳ Co, Eo Gió, tịnh xá Ngọc Hòa, lặn ngắm san hô và hải sản ven biển.", "Bình Định", Tour.TourType.beach, 2, 2_790_000L, 2_090_000L, 4.8, 136, "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&h=700&fit=crop");
            tour(tourRepository, provider, admin, quynhon, "tour-quy-nhon-cu-lao-xanh-2d", "Quy Nhơn - Cù Lao Xanh 2 ngày", "Quy Nhơn - Cù Lao Xanh 2 ngày", "Cù Lao Xanh, hải đăng cổ, bãi đá Thảo Nguyên và trải nghiệm làng chài.", "Cù Lao Xanh, hải đăng cổ, bãi đá Thảo Nguyên và trải nghiệm làng chài.", "Bình Định", Tour.TourType.beach, 2, 2_990_000L, 2_190_000L, 4.7, 91, "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1000&h=700&fit=crop");
            tour(tourRepository, provider, admin, quynhon, "tour-quy-nhon-tay-son-1d", "Quy Nhơn dấu ấn Tây Sơn 1 ngày", "Quy Nhơn dấu ấn Tây Sơn 1 ngày", "Bảo tàng Quang Trung, tháp Đôi, tháp Bánh Ít và võ cổ truyền Bình Định.", "Bảo tàng Quang Trung, tháp Đôi, tháp Bánh Ít và võ cổ truyền Bình Định.", "Bình Định", Tour.TourType.cultural, 1, 1_250_000L, 890_000L, 4.6, 77, "https://images.unsplash.com/photo-1562005094-c724030f99bd?w=1000&h=700&fit=crop");
            tour(tourRepository, provider, admin, quynhon, "tour-quy-nhon-phu-yen-3d", "Quy Nhơn - Phú Yên 3 ngày", "Quy Nhơn - Phú Yên 3 ngày", "Ghềnh Đá Đĩa, Bãi Xép, Mũi Điện, đầm Ô Loan và các cung đường biển đẹp.", "Ghềnh Đá Đĩa, Bãi Xép, Mũi Điện, đầm Ô Loan và các cung đường biển đẹp.", "Bình Định", Tour.TourType.nature, 3, 3_990_000L, 2_990_000L, 4.8, 121, "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1000&h=700&fit=crop");

            tour(tourRepository, provider, admin, hagiang, "tour-ha-giang-loop-4d", "Hà Giang vòng cung đá 4 ngày", "Hà Giang vòng cung đá 4 ngày", "Đồng Văn, Mã Pì Lèng, sông Nho Quế, Lũng Cú và các bản làng vùng cao.", "Đồng Văn, Mã Pì Lèng, sông Nho Quế, Lũng Cú và các bản làng vùng cao.", "Hà Giang", Tour.TourType.adventure, 4, 4_990_000L, 3_790_000L, 4.9, 204, "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1000&h=700&fit=crop");
            tour(tourRepository, provider, admin, hagiang, "tour-ha-giang-nho-que-3d", "Hà Giang - sông Nho Quế 3 ngày", "Hà Giang - sông Nho Quế 3 ngày", "Du thuyền sông Nho Quế, hẻm Tu Sản, phố cổ Đồng Văn và đèo Mã Pì Lèng.", "Du thuyền sông Nho Quế, hẻm Tu Sản, phố cổ Đồng Văn và đèo Mã Pì Lèng.", "Hà Giang", Tour.TourType.nature, 3, 3_990_000L, 2_990_000L, 4.8, 158, "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1000&h=700&fit=crop");
            tour(tourRepository, provider, admin, hagiang, "tour-ha-giang-mua-hoa-3d", "Hà Giang mùa hoa tam giác mạch 3 ngày", "Hà Giang mùa hoa tam giác mạch 3 ngày", "Thung lũng Sủng Là, dinh họ Vương, cột cờ Lũng Cú và mùa hoa tam giác mạch.", "Thung lũng Sủng Là, dinh họ Vương, cột cờ Lũng Cú và mùa hoa tam giác mạch.", "Hà Giang", Tour.TourType.mountain, 3, 4_290_000L, 3_190_000L, 4.8, 132, "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1000&h=700&fit=crop");
            tour(tourRepository, provider, admin, hagiang, "tour-ha-giang-van-hoa-ban-dia-2d", "Hà Giang văn hóa bản địa 2 ngày", "Hà Giang văn hóa bản địa 2 ngày", "Làng văn hóa người Mông, chợ phiên vùng cao, nhà trình tường và bữa cơm bản địa.", "Làng văn hóa người Mông, chợ phiên vùng cao, nhà trình tường và bữa cơm bản địa.", "Hà Giang", Tour.TourType.cultural, 2, 2_890_000L, 2_190_000L, 4.7, 89, "https://images.unsplash.com/photo-1562005094-c724030f99bd?w=1000&h=700&fit=crop");

            tour(tourRepository, provider, admin, condao, "tour-con-dao-nghi-duong-3d", "Côn Đảo nghỉ dưỡng biển xanh 3 ngày", "Côn Đảo nghỉ dưỡng biển xanh 3 ngày", "Bãi Đầm Trầu, mũi Cá Mập, chợ Côn Đảo và thời gian nghỉ dưỡng bên biển.", "Bãi Đầm Trầu, mũi Cá Mập, chợ Côn Đảo và thời gian nghỉ dưỡng bên biển.", "Bà Rịa - Vũng Tàu", Tour.TourType.beach, 3, 5_490_000L, 4_190_000L, 4.8, 119, "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1000&h=700&fit=crop");
            tour(tourRepository, provider, admin, condao, "tour-con-dao-hon-bay-canh-2d", "Côn Đảo - Hòn Bảy Cạnh 2 ngày", "Côn Đảo - Hòn Bảy Cạnh 2 ngày", "Hòn Bảy Cạnh, lặn ngắm san hô, rừng ngập mặn và bãi biển hoang sơ.", "Hòn Bảy Cạnh, lặn ngắm san hô, rừng ngập mặn và bãi biển hoang sơ.", "Bà Rịa - Vũng Tàu", Tour.TourType.nature, 2, 3_990_000L, 2_990_000L, 4.7, 86, "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&h=700&fit=crop");
            tour(tourRepository, provider, admin, condao, "tour-con-dao-lich-su-1d", "Côn Đảo dấu ấn lịch sử 1 ngày", "Côn Đảo dấu ấn lịch sử 1 ngày", "Nhà tù Côn Đảo, nghĩa trang Hàng Dương, miếu bà Phi Yến và bảo tàng Côn Đảo.", "Nhà tù Côn Đảo, nghĩa trang Hàng Dương, miếu bà Phi Yến và bảo tàng Côn Đảo.", "Bà Rịa - Vũng Tàu", Tour.TourType.cultural, 1, 1_490_000L, 1_090_000L, 4.7, 73, "https://images.unsplash.com/photo-1562005094-c724030f99bd?w=1000&h=700&fit=crop");
            tour(tourRepository, provider, admin, condao, "tour-con-dao-kham-pha-4d", "Côn Đảo khám phá trọn vẹn 4 ngày", "Côn Đảo khám phá trọn vẹn 4 ngày", "Kết hợp biển, rừng, di tích lịch sử, ẩm thực hải sản và các điểm ngắm hoàng hôn đẹp.", "Kết hợp biển, rừng, di tích lịch sử, ẩm thực hải sản và các điểm ngắm hoàng hôn đẹp.", "Bà Rịa - Vũng Tàu", Tour.TourType.adventure, 4, 6_290_000L, 4_790_000L, 4.9, 101, "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1000&h=700&fit=crop");

            syncTourRatingsFromReviews(tourRepository, reviewRepository);

            log.info("Sample travel catalog checked.");
        };
    }

    private Destination destination(DestinationRepository repository, String id, String nameVi, String descVi, String image, String region) {
        Destination destination = repository.findById(id).orElseGet(() -> {
            Destination item = new Destination();
            item.setId(id);
            return item;
        });
        destination.setNameVi(nameVi);
        destination.setDescriptionVi(descVi);
        destination.setImage(image);
        destination.setRegion(region);
        return repository.save(destination);
    }

    private User providerUser(UserRepository repository, PasswordEncoder passwordEncoder, String id, String name, String email, String phone) {
        return repository.findById(id).orElseGet(() -> {
            User user = new User();
            user.setId(id);
            user.setName(name);
            user.setEmail(email);
            user.setPasswordHash(passwordEncoder.encode("demo123"));
            user.setPhone(phone);
            user.setRole(User.UserRole.provider);
            user.setIsActive(true);
            user.setIsBanned(false);
            user.setProvider(User.AuthProvider.LOCAL);
            user.setEnabled(true);
            return repository.save(user);
        });
    }

    private Provider provider(
            ProviderRepository repository,
            User user,
            String id,
            String companyName,
            String taxCode,
            String licenseNumber,
            String phone,
            LocalDate joinedDate) {
        return repository.findById(id).orElseGet(() -> {
            Provider item = new Provider();
            item.setId(id);
            item.setUser(user);
            item.setCompanyName(companyName);
            item.setTaxCode(taxCode);
            item.setPhone(phone);
            item.setLicenseNumber(licenseNumber);
            item.setStatus(Provider.ProviderStatus.approved);
            item.setIsVerified(true);
            item.setJoinedDate(joinedDate);
            return repository.save(item);
        });
    }

    private User user(UserRepository repository, PasswordEncoder passwordEncoder, String id, String name, String email, String phone) {
        return repository.findById(id).orElseGet(() -> {
            User user = new User();
            user.setId(id);
            user.setName(name);
            user.setEmail(email);
            user.setPasswordHash(passwordEncoder.encode("demo123"));
            user.setPhone(phone);
            user.setRole(User.UserRole.user);
            user.setIsActive(true);
            user.setIsBanned(false);
            user.setProvider(User.AuthProvider.LOCAL);
            user.setEnabled(true);
            return repository.save(user);
        });
    }

    private String detailedDescriptionVi(String summary, String location, Tour.TourType type, int duration, long price, long childPrice) {
        String experience = switch (type) {
            case beach -> "những khoảng thời gian ở biển, đảo, ngắm hoàng hôn, tắm biển, chụp ảnh và thưởng thức hải sản địa phương";
            case mountain -> "không khí vùng cao, cảnh núi mở rộng, săn mây, cung đường đẹp và những điểm dừng mang màu sắc bản địa";
            case cultural -> "di sản, kiến trúc, làng nghề, câu chuyện địa phương và nhịp sống đặc trưng của người dân bản xứ";
            case food -> "các món đặc sản, quán ăn địa phương được chọn lọc, chợ/điểm ẩm thực và trải nghiệm ăn uống gần gũi";
            case adventure -> "hoạt động khám phá có nhịp nhanh hơn, cảnh quan thiên nhiên, vận động ngoài trời và những điểm check-in ít nhàm chán";
            case city -> "các biểu tượng thành phố, phố đêm, mua sắm, điểm check-in nổi bật và không khí đô thị sôi động";
            case nature -> "cảnh quan thiên nhiên, sông nước, không gian xanh, điểm tham quan thư giãn và lịch trình nhẹ nhàng";
        };
        String highlights = switch (type) {
            case beach -> "Tour không chỉ dừng ở việc tắm biển, mà còn cân bằng giữa nghỉ dưỡng, tham quan đảo, dùng bữa địa phương và thời gian tự do để bạn tận hưởng nhịp biển theo cách riêng.";
            case mountain -> "Điểm hay của tour là nhịp di chuyển vừa phải, có thời gian ngắm cảnh, chụp ảnh, cảm nhận khí hậu vùng cao và tìm hiểu đời sống địa phương thay vì chỉ đi qua các điểm check-in.";
            case cultural -> "Lịch trình ưu tiên các điểm có câu chuyện, giúp du khách hiểu vì sao nơi này đặc biệt, không chỉ chụp ảnh rồi rời đi. Các khoảng thời gian tham quan, ăn uống và tự do được chia hợp lý.";
            case food -> "Tour phù hợp với người muốn ăn đúng món địa phương, biết thêm bối cảnh văn hóa phía sau món ăn và có trải nghiệm ẩm thực thực tế hơn so với chỉ tự tìm quán trên mạng.";
            case adventure -> "Các hoạt động được sắp theo mức vừa sức, có hướng dẫn đi cùng và vẫn giữ khoảng nghỉ cần thiết để chuyến đi hào hứng nhưng không quá mệt.";
            case city -> "Tour gom các điểm nổi bật nhất của thành phố trong một lịch trình dễ theo, phù hợp với khách lần đầu đến nơi này hoặc nhóm muốn tối ưu thời gian cuối tuần.";
            case nature -> "Điểm mạnh là không gian thoáng, nhiều cảnh đẹp và lịch trình không quá dày, phù hợp để đổi gió, nghỉ ngơi và trải nghiệm địa phương trong thời gian ngắn.";
        };
        return summary + "\n\n"
                + "Trong " + duration + " ngày, tour đưa du khách khám phá " + location + " qua " + experience + ". Lịch trình được thiết kế để người đi lần đầu vẫn dễ hình dung: mỗi ngày có điểm nhấn rõ ràng, có thời gian di chuyển, tham quan, ăn uống và nghỉ ngơi hợp lý.\n\n"
                + highlights + "\n\n"
                + "Dịch vụ đã bao gồm xe đưa đón theo chương trình, hướng dẫn viên địa phương, vé vào các điểm chính, bữa ăn theo lịch trình và hỗ trợ trong suốt chuyến đi. Trước ngày khởi hành, khách sẽ được nhắc lịch, điểm đón, vật dụng nên chuẩn bị và các lưu ý theo thời tiết.\n\n"
                + "Tour phù hợp với nhóm bạn, cặp đôi, gia đình có trẻ em hoặc khách muốn có một chuyến đi trọn gói, dễ đi, ít phải tự lo khâu sắp xếp. Giá người lớn từ " + formatVnd(price) + ", trẻ em từ " + formatVnd(childPrice) + ".";
    }

    private String formatVnd(long amount) {
        return String.format("%,dđ", amount).replace(",", ".");
    }

    private String shortSeedId(String prefix, String source, int index) {
        return prefix + "-" + Integer.toUnsignedString(source.hashCode(), 36) + "-" + index;
    }

    private void ensureTourTypeSchema(JdbcTemplate jdbcTemplate) {
        String columnType = jdbcTemplate.queryForObject("""
                SELECT COLUMN_TYPE
                FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'tours'
                  AND COLUMN_NAME = 'type'
                """, String.class);
        if (columnType == null || !columnType.contains("'mountain'")) {
            jdbcTemplate.execute("""
                    ALTER TABLE tours
                      MODIFY type ENUM('adventure','beach','cultural','food','nature','mountain','city') NOT NULL
                    """);
        }
    }

    private void ensureTourCategorySchema(JdbcTemplate jdbcTemplate) {
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS tour_categories (
                    code VARCHAR(30) PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    description TEXT NULL,
                    active BOOLEAN NOT NULL DEFAULT TRUE,
                    sort_order INT NOT NULL DEFAULT 0,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_tour_categories_active (active),
                    INDEX idx_tour_categories_sort (sort_order)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """);
        jdbcTemplate.batchUpdate("""
                INSERT INTO tour_categories (code, name, description, active, sort_order)
                VALUES (?, ?, ?, TRUE, ?)
                ON DUPLICATE KEY UPDATE
                    name = VALUES(name),
                    description = VALUES(description),
                    sort_order = VALUES(sort_order)
                """,
                List.of(
                        new Object[]{"beach", "Biển đảo", "Tour nghỉ dưỡng biển, đảo, vịnh và các hoạt động dưới nước.", 10},
                        new Object[]{"nature", "Thiên nhiên", "Tour sinh thái, cảnh quan tự nhiên, nghỉ dưỡng xanh.", 20},
                        new Object[]{"mountain", "Núi", "Tour vùng cao, săn mây, trekking nhẹ và cảnh quan núi.", 30},
                        new Object[]{"cultural", "Văn hóa", "Tour di sản, lịch sử, làng nghề và trải nghiệm bản địa.", 40},
                        new Object[]{"adventure", "Mạo hiểm", "Tour vận động, khám phá, trekking và hoạt động trải nghiệm mạnh.", 50},
                        new Object[]{"food", "Ẩm thực", "Tour khám phá món ăn địa phương và trải nghiệm ẩm thực.", 60},
                        new Object[]{"city", "Thành phố", "Tour city tour, check-in, mua sắm và đời sống đô thị.", 70}
                ));
    }

    private void ensureOnDemandTourSchema(JdbcTemplate jdbcTemplate) {
        addColumnIfMissing(jdbcTemplate, "tours", "max_people_per_day", "INT NOT NULL DEFAULT 20 AFTER duration");
        boolean addedAdvanceBookingDays = addColumnIfMissing(jdbcTemplate, "tours", "advance_booking_days", "INT NOT NULL DEFAULT 3 AFTER max_people_per_day");
        addColumnIfMissing(jdbcTemplate, "tours", "excluded_services", "TEXT NULL AFTER promotion_source");
        addColumnIfMissing(jdbcTemplate, "tours", "included_services", "TEXT NULL AFTER excluded_services");
        addColumnIfMissing(jdbcTemplate, "tours", "itinerary_json", "LONGTEXT NULL AFTER included_services");
        addColumnIfMissing(jdbcTemplate, "tours", "images_json", "LONGTEXT NULL AFTER itinerary_json");
        if (addedAdvanceBookingDays) {
            jdbcTemplate.execute("""
                    UPDATE tours
                    SET advance_booking_days = CASE
                        WHEN duration <= 1 THEN 1
                        WHEN duration <= 3 THEN 3
                        WHEN duration <= 5 THEN 5
                        ELSE 7
                    END
                    """);
        }
        addColumnIfMissing(jdbcTemplate, "bookings", "start_date", "DATE NULL AFTER departure_schedule_id");
        jdbcTemplate.execute("""
                UPDATE bookings b
                JOIN departure_schedules ds ON ds.id = b.departure_schedule_id
                SET b.start_date = ds.departure_date
                WHERE b.start_date IS NULL
                """);
    }

    private void ensureDatabaseOptimizationSchema(JdbcTemplate jdbcTemplate) {
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS user_interactions (
                    id VARCHAR(36) PRIMARY KEY,
                    user_id VARCHAR(36) NOT NULL,
                    tour_id VARCHAR(36) NULL,
                    action ENUM('view','search','click','bookmark') NOT NULL,
                    search_query VARCHAR(255) NULL,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_interactions_user_created (user_id, created_at),
                    INDEX idx_interactions_user_action_created (user_id, action, created_at),
                    INDEX idx_interactions_tour_created (tour_id, created_at),
                    CONSTRAINT fk_interactions_user
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    CONSTRAINT fk_interactions_tour
                        FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE SET NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """);

        addIndexIfMissing(jdbcTemplate, "users", "idx_users_role_active", "role, is_active, is_banned");
        addIndexIfMissing(jdbcTemplate, "providers", "idx_providers_status_verified", "status, is_verified");

        addIndexIfMissing(jdbcTemplate, "tours", "idx_tours_status_availability_rating", "status, availability, rating");
        addIndexIfMissing(jdbcTemplate, "tours", "idx_tours_provider_status_updated", "provider_id, status, updated_at");
        addIndexIfMissing(jdbcTemplate, "tours", "idx_tours_status_type_price", "status, type, price");
        addIndexIfMissing(jdbcTemplate, "tours", "idx_tours_destination_status", "destination_id, status");

        addIndexIfMissing(jdbcTemplate, "departure_schedules", "idx_schedules_status_date", "status, departure_date");

        addIndexIfMissing(jdbcTemplate, "bookings", "idx_bookings_user_created", "user_id, created_at");
        addIndexIfMissing(jdbcTemplate, "bookings", "idx_bookings_tour_start_status", "tour_id, start_date, status");
        addIndexIfMissing(jdbcTemplate, "bookings", "idx_bookings_status_created", "status, created_at");
        addIndexIfMissing(jdbcTemplate, "bookings", "idx_bookings_status_start", "status, start_date");
        addIndexIfMissing(jdbcTemplate, "bookings", "idx_bookings_refund_status_created", "refund_status, created_at");
        addIndexIfMissing(jdbcTemplate, "bookings", "idx_bookings_payout_status_created", "payout_status, created_at");
        addIndexIfMissing(jdbcTemplate, "bookings", "idx_bookings_payment_status_created", "payment_status, created_at");
        addIndexIfMissing(jdbcTemplate, "bookings", "idx_bookings_payment_transaction", "payment_transaction_code");

        addIndexIfMissing(jdbcTemplate, "tour_reviews", "idx_reviews_tour_created", "tour_id, created_at");
        addIndexIfMissing(jdbcTemplate, "tour_reviews", "idx_reviews_user_created", "user_id, created_at");
        addIndexIfMissing(jdbcTemplate, "tour_reviews", "idx_reviews_response_requested", "response_requested, created_at");

        addIndexIfMissing(jdbcTemplate, "tour_reports", "idx_reports_status_created", "status, created_at");
        addIndexIfMissing(jdbcTemplate, "tour_reports", "idx_reports_tour_status", "tour_id, status");
        addIndexIfMissing(jdbcTemplate, "tour_reports", "idx_reports_reporter_created", "reported_by, created_at");

        addIndexIfMissing(jdbcTemplate, "tour_messages", "idx_messages_tour_sent", "tour_id, sent_at");
        addIndexIfMissing(jdbcTemplate, "contact_messages", "idx_contacts_status_created", "status, created_at");
        addIndexIfMissing(jdbcTemplate, "contact_messages", "idx_contacts_created", "created_at");
        addIndexIfMissing(jdbcTemplate, "favorites", "idx_favorites_tour", "tour_id");
        addIndexIfMissing(jdbcTemplate, "user_interactions", "idx_interactions_user_created", "user_id, created_at");
        addIndexIfMissing(jdbcTemplate, "user_interactions", "idx_interactions_user_action_created", "user_id, action, created_at");
        addIndexIfMissing(jdbcTemplate, "user_interactions", "idx_interactions_tour_created", "tour_id, created_at");
        addIndexIfMissing(jdbcTemplate, "email_verification_codes", "idx_email_verification_lookup", "email, purpose, used, expires_at");
    }

    private void ensurePaymentSchema(JdbcTemplate jdbcTemplate) {
        jdbcTemplate.execute("""
                ALTER TABLE bookings
                  MODIFY status ENUM('pending','deposited','paid','confirmed','completed','cancelled','refunded') NOT NULL DEFAULT 'pending'
                """);
        addColumnIfMissing(jdbcTemplate, "bookings", "deposit_amount", "BIGINT NOT NULL DEFAULT 0 AFTER total_amount");
        addColumnIfMissing(jdbcTemplate, "bookings", "remaining_amount", "BIGINT NOT NULL DEFAULT 0 AFTER deposit_amount");
        addColumnIfMissing(jdbcTemplate, "bookings", "commission_rate", "INT NOT NULL DEFAULT 10 AFTER remaining_amount");
        addColumnIfMissing(jdbcTemplate, "bookings", "commission_amount", "BIGINT NOT NULL DEFAULT 0 AFTER commission_rate");
        addColumnIfMissing(jdbcTemplate, "bookings", "provider_payout_amount", "BIGINT NOT NULL DEFAULT 0 AFTER commission_amount");
        addColumnIfMissing(jdbcTemplate, "bookings", "cancelled_by", "VARCHAR(20) NULL AFTER provider_payout_amount");
        addColumnIfMissing(jdbcTemplate, "bookings", "cancelled_at", "DATETIME NULL AFTER cancelled_by");
        addColumnIfMissing(jdbcTemplate, "bookings", "cancel_reason", "TEXT NULL AFTER cancelled_at");
        addColumnIfMissing(jdbcTemplate, "bookings", "refund_status", "ENUM('none','refund_pending','refunded','no_refund','refund_rejected') NOT NULL DEFAULT 'none' AFTER cancel_reason");
        addColumnIfMissing(jdbcTemplate, "bookings", "refund_amount", "BIGINT NOT NULL DEFAULT 0 AFTER refund_status");
        addColumnIfMissing(jdbcTemplate, "bookings", "refund_bank_name", "VARCHAR(100) NULL AFTER refund_amount");
        addColumnIfMissing(jdbcTemplate, "bookings", "refund_account_number", "VARCHAR(50) NULL AFTER refund_bank_name");
        addColumnIfMissing(jdbcTemplate, "bookings", "refund_account_name", "VARCHAR(100) NULL AFTER refund_account_number");
        addColumnIfMissing(jdbcTemplate, "bookings", "refund_requested_at", "DATETIME NULL AFTER refund_account_name");
        addColumnIfMissing(jdbcTemplate, "bookings", "refund_processed_at", "DATETIME NULL AFTER refund_requested_at");
        addColumnIfMissing(jdbcTemplate, "bookings", "refund_processed_by", "VARCHAR(36) NULL AFTER refund_processed_at");
        addColumnIfMissing(jdbcTemplate, "bookings", "refund_reject_reason", "TEXT NULL AFTER refund_processed_by");
        addColumnIfMissing(jdbcTemplate, "bookings", "payout_status", "ENUM('none','payout_pending','paid_out') NOT NULL DEFAULT 'none' AFTER refund_reject_reason");
        addColumnIfMissing(jdbcTemplate, "bookings", "payout_amount", "BIGINT NOT NULL DEFAULT 0 AFTER payout_status");
        addColumnIfMissing(jdbcTemplate, "bookings", "payout_processed_at", "DATETIME NULL AFTER payout_amount");
        addColumnIfMissing(jdbcTemplate, "bookings", "payout_processed_by", "VARCHAR(36) NULL AFTER payout_processed_at");
        addColumnIfMissing(jdbcTemplate, "bookings", "payment_method", "VARCHAR(30) NULL AFTER payout_processed_by");
        addColumnIfMissing(jdbcTemplate, "bookings", "payment_status", "VARCHAR(30) NULL AFTER payment_method");
        addColumnIfMissing(jdbcTemplate, "bookings", "payment_amount", "BIGINT NULL AFTER payment_status");
        addColumnIfMissing(jdbcTemplate, "bookings", "payment_transaction_code", "VARCHAR(200) NULL AFTER payment_amount");
        addColumnIfMissing(jdbcTemplate, "bookings", "payment_url", "VARCHAR(1000) NULL AFTER payment_transaction_code");
        addColumnIfMissing(jdbcTemplate, "bookings", "payment_qr_code", "TEXT NULL AFTER payment_url");
        addColumnIfMissing(jdbcTemplate, "bookings", "paid_at", "DATETIME NULL AFTER payment_qr_code");
        jdbcTemplate.execute("""
                UPDATE bookings
                SET commission_rate = COALESCE(NULLIF(commission_rate, 0), 10),
                    commission_amount = CASE
                        WHEN commission_amount IS NULL OR commission_amount = 0 THEN ROUND(total_amount * 0.10)
                        ELSE commission_amount
                    END,
                    deposit_amount = CASE
                        WHEN deposit_amount IS NULL OR deposit_amount = 0 THEN total_amount
                        ELSE deposit_amount
                    END,
                    remaining_amount = CASE
                        WHEN remaining_amount IS NULL THEN 0
                        ELSE remaining_amount
                    END,
                    provider_payout_amount = CASE
                        WHEN provider_payout_amount IS NULL OR provider_payout_amount = 0 THEN GREATEST(total_amount - ROUND(total_amount * 0.10), 0)
                        ELSE provider_payout_amount
                    END,
                    payout_amount = CASE
                        WHEN payout_amount IS NULL OR payout_amount = 0 THEN provider_payout_amount
                        ELSE payout_amount
                    END
                """);
    }

    private void dropLegacyTables(JdbcTemplate jdbcTemplate) {
        jdbcTemplate.execute("DROP TABLE IF EXISTS payments");
        jdbcTemplate.execute("DROP TABLE IF EXISTS tour_blocked_dates");
        jdbcTemplate.execute("DROP TABLE IF EXISTS tour_includes");
        jdbcTemplate.execute("DROP TABLE IF EXISTS tour_images");
        jdbcTemplate.execute("DROP TABLE IF EXISTS tour_itineraries");
    }

    private void ensureReportSchema(JdbcTemplate jdbcTemplate) {
        addColumnIfMissing(jdbcTemplate, "tour_reports", "booking_id", "VARCHAR(36) NULL AFTER reported_by");
        addColumnIfMissing(jdbcTemplate, "tour_reports", "images", "LONGTEXT NULL");
        jdbcTemplate.execute("ALTER TABLE tour_reports MODIFY images LONGTEXT NULL");
    }

    private void ensureReviewSchema(JdbcTemplate jdbcTemplate) {
        addColumnIfMissing(jdbcTemplate, "bookings", "reviewed_at", "DATETIME NULL");
        jdbcTemplate.execute("""
                UPDATE bookings b
                JOIN tour_reviews tr ON tr.booking_id = b.id
                SET b.reviewed_at = COALESCE(b.reviewed_at, tr.created_at)
                WHERE b.reviewed_at IS NULL
                """);
        addColumnIfMissing(jdbcTemplate, "tour_reviews", "images", "LONGTEXT NULL");
        jdbcTemplate.execute("ALTER TABLE tour_reviews MODIFY images LONGTEXT NULL");
        addColumnIfMissing(jdbcTemplate, "tour_reviews", "response_requested", "BOOLEAN NOT NULL DEFAULT FALSE");
        addColumnIfMissing(jdbcTemplate, "tour_reviews", "response_requested_at", "DATETIME NULL");
        addColumnIfMissing(jdbcTemplate, "tour_reviews", "response_requested_by", "VARCHAR(36) NULL");
        addForeignKeyIfMissing(
                jdbcTemplate,
                "tour_reviews",
                "fk_reviews_response_requested_by",
                "FOREIGN KEY (response_requested_by) REFERENCES users(id) ON DELETE SET NULL");
    }

    private void removeEnglishContentColumns(JdbcTemplate jdbcTemplate) {
        dropColumnIfExists(jdbcTemplate, "destinations", "name_en");
        dropColumnIfExists(jdbcTemplate, "destinations", "description_en");
        dropColumnIfExists(jdbcTemplate, "tours", "name_en");
        dropColumnIfExists(jdbcTemplate, "tours", "description_en");
    }

    private void ensureAuthSchema(JdbcTemplate jdbcTemplate) {
        addColumnIfMissing(jdbcTemplate, "users", "avatar_url", "LONGTEXT NULL");
        jdbcTemplate.execute("ALTER TABLE users MODIFY avatar_url LONGTEXT NULL");
        addColumnIfMissing(jdbcTemplate, "users", "provider", "ENUM('LOCAL','GOOGLE') NOT NULL DEFAULT 'LOCAL'");
        addColumnIfMissing(jdbcTemplate, "users", "enabled", "BOOLEAN NOT NULL DEFAULT TRUE");
        addColumnIfMissing(jdbcTemplate, "users", "updated_at", "DATETIME NULL");
        if (columnExists(jdbcTemplate, "users", "avatar")) {
            jdbcTemplate.execute("""
                    UPDATE users
                    SET avatar_url = avatar
                    WHERE avatar_url IS NULL AND avatar IS NOT NULL
                    """);
        }
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS email_verification_codes (
                    id VARCHAR(36) PRIMARY KEY,
                    email VARCHAR(150) NOT NULL,
                    code_hash VARCHAR(255) NOT NULL,
                    expires_at DATETIME NOT NULL,
                    used BOOLEAN NOT NULL DEFAULT FALSE,
                    purpose VARCHAR(30) NOT NULL DEFAULT 'EMAIL_VERIFICATION',
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_email_verification_email_created (email, created_at)
                )
                """);
        addColumnIfMissing(jdbcTemplate, "email_verification_codes", "purpose", "VARCHAR(30) NOT NULL DEFAULT 'EMAIL_VERIFICATION'");
    }

    private boolean addColumnIfMissing(JdbcTemplate jdbcTemplate, String tableName, String columnName, String definition) {
        if (!columnExists(jdbcTemplate, tableName, columnName)) {
            jdbcTemplate.execute("ALTER TABLE " + tableName + " ADD COLUMN " + columnName + " " + definition);
            return true;
        }
        return false;
    }

    private void dropColumnIfExists(JdbcTemplate jdbcTemplate, String tableName, String columnName) {
        if (columnExists(jdbcTemplate, tableName, columnName)) {
            jdbcTemplate.execute("ALTER TABLE " + tableName + " DROP COLUMN " + columnName);
        }
    }

    private void addForeignKeyIfMissing(JdbcTemplate jdbcTemplate, String tableName, String constraintName, String definition) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM information_schema.TABLE_CONSTRAINTS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = ?
                  AND CONSTRAINT_NAME = ?
                """, Integer.class, tableName, constraintName);
        if (count == null || count == 0) {
            jdbcTemplate.execute("ALTER TABLE " + tableName + " ADD CONSTRAINT " + constraintName + " " + definition);
        }
    }

    private void addIndexIfMissing(JdbcTemplate jdbcTemplate, String tableName, String indexName, String columns) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM information_schema.STATISTICS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = ?
                  AND INDEX_NAME = ?
                """, Integer.class, tableName, indexName);
        if (count == null || count == 0) {
            jdbcTemplate.execute("ALTER TABLE " + tableName + " ADD INDEX " + indexName + " (" + columns + ")");
        }
    }

    private boolean columnExists(JdbcTemplate jdbcTemplate, String tableName, String columnName) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = ?
                  AND COLUMN_NAME = ?
                """, Integer.class, tableName, columnName);
        return count != null && count > 0;
    }

    private void tour(TourRepository repository, Provider provider, User admin, Destination destination, String id, String nameVi, String nameEn, String descVi, String descEn, String location, Tour.TourType type, int duration, long price, long childPrice, double rating, int reviews, String image) {
        var existing = repository.findById(id);
        boolean newTour = existing.isEmpty();
        Tour tour = existing.orElseGet(() -> {
            Tour item = new Tour();
            item.setId(id);
            return item;
        });
        tour.setProvider(provider);
        tour.setDestination(destination);
        tour.setNameVi(nameVi);
        tour.setDescriptionVi(detailedDescriptionVi(descVi, location, type, duration, price, childPrice));
        tour.setLocation(location);
        tour.setType(type);
        tour.setDuration(duration);
        tour.setAdvanceBookingDays(Tour.suggestedAdvanceBookingDays(duration));
        tour.setMaxPeoplePerDay(50);
        if (!Boolean.TRUE.equals(tour.getPromotionActive())) {
            tour.setPrice(price);
            tour.setChildPrice(childPrice);
        } else {
            if (tour.getOriginalPrice() == null || tour.getOriginalPrice() <= 0) {
                tour.setOriginalPrice(price);
            }
            if (tour.getPrice() == null || tour.getPrice() >= tour.getOriginalPrice()) {
                int discount = tour.getDiscountPercent() != null && tour.getDiscountPercent() > 0 ? tour.getDiscountPercent() : 28;
                tour.setPrice(Math.max(1_000L, Math.round(tour.getOriginalPrice() * (100 - discount) / 100.0)));
                tour.setChildPrice(Math.max(1_000L, Math.round(childPrice * (100 - discount) / 100.0)));
            }
        }
        tour.setImage(image);
        tour.setAvailability(true);
        tour.setStatus(Tour.TourStatus.approved);
        tour.setSubmittedAt(LocalDateTime.now().minusDays(12));
        tour.setReviewedAt(LocalDateTime.now().minusDays(10));
        tour.setReviewedBy(admin);

        if (newTour) {
            tour.setIncludedServices(writeJson(List.of("transportation", "tourGuide", "entrance", "meals")));
            List<Map<String, Object>> itineraries = new java.util.ArrayList<>();
            itineraries.add(Map.of(
                    "day", 1,
                    "title", "Khoi hanh - Tham quan tong quan",
                    "activities", List.of("Don khach tai diem hen", "Di chuyen den " + location, "Tham quan diem noi bat dau tien")));
            if (duration > 1) {
                itineraries.add(Map.of(
                        "day", 2,
                        "title", "Trai nghiem chinh tai " + location,
                        "activities", List.of("Tham quan cac diem noi bat", "Dung bua theo chuong trinh", "Tu do kham pha buoi toi")));
            }
            if (duration > 2) {
                itineraries.add(Map.of(
                        "day", duration,
                        "title", "Tu do mua sam - Tro ve",
                        "activities", List.of("Tu do mua sam dac san", "Tra phong", "Xe dua doan ve diem hen")));
            }
            tour.setItineraryJson(writeJson(itineraries));
            tour.setImagesJson(writeJson(List.of(image, secondaryImage(type, location), tertiaryImage(type, location))));
        }

        repository.save(tour);
    }

    private void syncTourRatingsFromReviews(TourRepository tourRepository, TourReviewRepository reviewRepository) {
        for (Tour tour : tourRepository.findAll()) {
            List<TourReview> reviews = reviewRepository.findByTourIdOrderByCreatedAtDesc(tour.getId());
            if (reviews.isEmpty()) {
                tour.setRating(BigDecimal.ZERO);
                tour.setReviewCount(0);
            } else {
                double average = reviews.stream().mapToInt(TourReview::getRating).average().orElse(0);
                tour.setRating(BigDecimal.valueOf(average).setScale(1, RoundingMode.HALF_UP));
                tour.setReviewCount(reviews.size());
            }
            tourRepository.save(tour);
        }
    }

    private String writeJson(Object value) {
        try {
            return JSON.writeValueAsString(value);
        } catch (Exception ignored) {
            return "[]";
        }
    }

    private String secondaryImage(Tour.TourType type, String location) {
        if (location.contains("Hội An") || location.contains("Quảng Nam")) {
            return "https://images.unsplash.com/photo-1562005094-c724030f99bd?w=1000&h=700&fit=crop";
        }
        if (location.contains("Đà Nẵng")) {
            return "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1000&h=700&fit=crop";
        }
        if (location.contains("Lào Cai")) {
            return "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1000&h=700&fit=crop";
        }
        if (location.contains("Kiên Giang") || location.contains("Khánh Hòa")) {
            return "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1000&h=700&fit=crop";
        }
        if (location.contains("Cần Thơ")) {
            return "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1000&h=700&fit=crop";
        }
        return type == Tour.TourType.beach
                ? "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&h=700&fit=crop"
                : "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1000&h=700&fit=crop";
    }

    private String tertiaryImage(Tour.TourType type, String location) {
        if (location.contains("Quảng Ninh")) {
            return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&h=700&fit=crop";
        }
        if (type == Tour.TourType.adventure || type == Tour.TourType.mountain) {
            return "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1000&h=700&fit=crop";
        }
        if (type == Tour.TourType.cultural) {
            return "https://images.unsplash.com/photo-1562005094-c724030f99bd?w=1000&h=700&fit=crop";
        }
        return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&h=700&fit=crop";
    }

    private void addSchedule(DepartureScheduleRepository repository, TourRepository tourRepository, String tourId) {
        Tour tour = tourRepository.findById(tourId).orElse(null);
        if (tour == null) {
            return;
        }
        for (int index = 1; index <= 2; index++) {
            LocalDate departureDate = LocalDate.now().plusDays(index * 14L);
            if (repository.findByTourIdAndDepartureDate(tourId, departureDate).isPresent()) {
                continue;
            }
            DepartureSchedule schedule = new DepartureSchedule();
            schedule.setId(shortSeedId("sch", tourId, index));
            schedule.setTour(tour);
            schedule.setDepartureDate(departureDate);
            schedule.setTotalSlots(20);
            schedule.setBookedSlots(index == 1 ? 3 : 0);
            schedule.setStatus(DepartureSchedule.ScheduleStatus.open);
            repository.save(schedule);
        }
    }

    private void seedReviews(
            BookingRepository bookingRepository,
            TourReviewRepository reviewRepository,
            TourRepository tourRepository,
            List<User> travelers) {
        List<String> tourIds = tourRepository.findAll().stream()
                .filter(tour -> tour.getStatus() == Tour.TourStatus.approved)
                .map(Tour::getId)
                .sorted()
                .toList();
        String[] comments = {
                "Lịch trình rõ ràng, đi đủ các điểm chính nhưng không bị quá gấp. Hướng dẫn viên nói chuyện dễ hiểu và hỗ trợ nhóm mình khá sát.",
                "Dịch vụ đúng mô tả, xe sạch, giờ đón đúng. Mình thích nhất là có thời gian tự do nên không bị cảm giác chạy tour.",
                "Gia đình mình đi có trẻ nhỏ vẫn theo được lịch trình. Bữa ăn ổn, khách sạn sạch và các điểm tham quan được sắp xếp hợp lý.",
                "Tour đáng tiền so với chi phí. Có vài đoạn đông khách vào cuối tuần nhưng bên điều hành xử lý tốt và thông báo trước.",
                "Trải nghiệm thực tế khá giống thông tin tour. Phần tư vấn trước chuyến đi kỹ, cần mang gì và chuẩn bị gì đều được nhắc rõ."
        };

        int seedIndex = 0;
        for (String tourId : tourIds) {
            for (int offset = 0; offset < 4; offset++) {
                User traveler = travelers.get((seedIndex + offset) % travelers.size());
                int rating = switch ((seedIndex + offset) % 8) {
                    case 0, 3, 6 -> 5;
                    case 5 -> 3;
                    default -> 4;
                };
                String reviewId = shortSeedId("rev", tourId, offset + 1);
                String comment = comments[(seedIndex + offset) % comments.length];
                sampleReview(
                        bookingRepository,
                        reviewRepository,
                        tourRepository,
                        traveler,
                        reviewId,
                        tourId,
                        rating,
                        comment,
                        2 + ((seedIndex + offset) % 3),
                        (seedIndex + offset) % 2,
                        (seedIndex + offset) * 3 + 4,
                        10 + seedIndex + offset);
            }
            seedIndex++;
        }
    }

    private void sampleReview(
            BookingRepository bookingRepository,
            TourReviewRepository reviewRepository,
            TourRepository tourRepository,
            User user,
            String reviewId,
            String tourId,
            int rating,
            String comment,
            int adults,
            int children,
            int helpfulCount,
            int daysAgo) {
        if (reviewRepository.existsById(reviewId)) {
            return;
        }
        Tour tour = tourRepository.findById(tourId).orElse(null);
        if (tour == null || user == null) {
            return;
        }

        String bookingId = shortSeedId("book", reviewId, 1);
        Booking booking = bookingRepository.findById(bookingId).orElseGet(() -> {
            Booking item = new Booking();
            item.setId(bookingId);
            item.setTour(tour);
            item.setUser(user);
            item.setAdults(adults);
            item.setChildren(children);
            long adultPrice = tour.getPrice() == null ? 0L : tour.getPrice();
            long childPrice = tour.getChildPrice() == null ? Math.round(adultPrice * 0.75) : tour.getChildPrice();
            item.setTotalAmount(adultPrice * adults + childPrice * children);
            item.setStatus(Booking.BookingStatus.completed);
            item.setContactName(user.getName());
            item.setContactEmail(user.getEmail());
            item.setContactPhone(user.getPhone() == null ? "0900000000" : user.getPhone());
            item.setCreatedAt(LocalDateTime.now().minusDays(daysAgo + 5L));
            return bookingRepository.save(item);
        });

        TourReview review = new TourReview();
        review.setId(reviewId);
        review.setTour(tour);
        review.setUser(user);
        review.setBooking(booking);
        review.setRating(rating);
        review.setComment(comment);
        review.setHelpfulCount(helpfulCount);
        review.setCreatedAt(LocalDateTime.now().minusDays(daysAgo));
        if (rating >= 4 && daysAgo % 3 == 0) {
            review.setResponseFrom("Công ty Du lịch Bắc Việt");
            review.setResponseMessage("Cảm ơn anh/chị đã tin chọn tour. Đội ngũ rất vui vì lịch trình mang lại trải nghiệm tốt và sẽ tiếp tục cải thiện dịch vụ trong các chuyến sau.");
            review.setResponseAt(LocalDateTime.now().minusDays(Math.max(1, daysAgo - 1L)));
        }
        reviewRepository.save(review);
    }
}

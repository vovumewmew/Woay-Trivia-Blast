-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: woay_trivia
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `answers`
--

DROP TABLE IF EXISTS `answers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `answers` (
  `answer_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `question_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `answer_text` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_correct` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`answer_id`),
  KEY `question_id` (`question_id`),
  CONSTRAINT `answers_ibfk_1` FOREIGN KEY (`question_id`) REFERENCES `questions` (`question_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `answers`
--

LOCK TABLES `answers` WRITE;
/*!40000 ALTER TABLE `answers` DISABLE KEYS */;
INSERT INTO `answers` VALUES ('ANS_001','QS_001','Tết Tây',0),('ANS_002','QS_001','Tết Đoan Ngọ',0),('ANS_003','QS_001','Tết Ta (Tết Cổ Truyền)',1),('ANS_004','QS_001','Tết Trung Thu',0),('ANS_005','QS_002','Ông Địa',0),('ANS_006','QS_002','Thần Tài',0),('ANS_007','QS_002','Thổ Công',0),('ANS_008','QS_002','Ông Táo',1),('ANS_009','QS_003','Hoa Đào',0),('ANS_010','QS_003','Hoa Mai',1),('ANS_011','QS_003','Hoa Cúc',0),('ANS_012','QS_003','Hoa Hướng Dương',0),('ANS_013','QS_004','Mãng cầu',0),('ANS_014','QS_004','Đu đủ',0),('ANS_015','QS_004','Xoài',0),('ANS_016','QS_004','Chuối',1),('ANS_017','QS_005','Màu trắng',0),('ANS_018','QS_005','Màu đen',0),('ANS_019','QS_005','Màu đỏ',1),('ANS_020','QS_005','Màu xám',0),('ANS_021','QS_006','Chim bồ câu',0),('ANS_022','QS_006','Chim én',1),('ANS_023','QS_006','Chim đại bàng',0),('ANS_024','QS_006','Chim cú',0),('ANS_025','QS_007','Mặc quần áo mới',0),('ANS_026','QS_007','Ăn dưa hấu',0),('ANS_027','QS_007','Quét nhà, đổ rác',1),('ANS_028','QS_007','Đi chúc Tết',0),('ANS_029','QS_008','Ông bà, người lớn tuổi',1),('ANS_030','QS_008','Trẻ em',0),('ANS_031','QS_008','Bạn bè',0),('ANS_032','QS_008','Đồng nghiệp',0),('ANS_033','QS_009','Tết Cha',0),('ANS_034','QS_009','Tết Mẹ',0),('ANS_035','QS_009','Tết Thầy',1),('ANS_036','QS_009','Tết Bạn bè',0),('ANS_037','QS_010','Ngủ thật say',0),('ANS_038','QS_010','Xem bắn pháo hoa',1),('ANS_039','QS_010','Đi bơi',0),('ANS_040','QS_010','Thả diều',0),('ANS_041','QS_011','Hình tròn',0),('ANS_042','QS_011','Hình vuông',1),('ANS_043','QS_011','Hình tam giác',0),('ANS_044','QS_011','Hình chữ nhật',0),('ANS_045','QS_012','Cầu mong cái khổ qua đi',1),('ANS_046','QS_012','Ăn cho thanh mát',0),('ANS_047','QS_012','Sống lâu trăm tuổi',0),('ANS_048','QS_012','Phát tài phát lộc',0),('ANS_049','QS_013','Lá dong',0),('ANS_050','QS_013','Lá sen',0),('ANS_051','QS_013','Lá dừa',0),('ANS_052','QS_013','Lá chuối',1),('ANS_053','QS_014','Thịt bò, khoai tây',0),('ANS_054','QS_014','Trứng vịt, thịt ba chỉ',1),('ANS_055','QS_014','Cá lóc, dứa',0),('ANS_056','QS_014','Gà, sả',0),('ANS_057','QS_015','Chả lụa',0),('ANS_058','QS_015','Tôm khô',1),('ANS_059','QS_015','Bánh phồng tôm',0),('ANS_060','QS_015','Hạt dưa',0),('ANS_061','QS_016','Mứt dừa',0),('ANS_062','QS_016','Mứt me',0),('ANS_063','QS_016','Mứt gừng',1),('ANS_064','QS_016','Mứt bí',0),('ANS_065','QS_017','Hạt điều',0),('ANS_066','QS_017','Hạt dưa',1),('ANS_067','QS_017','Hạt dẻ',0),('ANS_068','QS_017','Hạt óc chó',0),('ANS_069','QS_018','Xôi xéo',0),('ANS_070','QS_018','Xôi đậu đen',0),('ANS_071','QS_018','Xôi mặn',0),('ANS_072','QS_018','Xôi gấc',1),('ANS_073','QS_019','Phần đầu (tai, mũi, lưỡi)',1),('ANS_074','QS_019','Phần đùi',0),('ANS_075','QS_019','Phần sườn',0),('ANS_076','QS_019','Phần bụng',0),('ANS_077','QS_020','Miền Trung',0),('ANS_078','QS_020','Miền Nam',0),('ANS_079','QS_020','Miền Bắc',1),('ANS_080','QS_020','Miền Tây',0);
/*!40000 ALTER TABLE `answers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `questions`
--

DROP TABLE IF EXISTS `questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `questions` (
  `question_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quiz_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `question_text` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `time_limit` int DEFAULT '20',
  `points` int DEFAULT '1000',
  PRIMARY KEY (`question_id`),
  KEY `quiz_id` (`quiz_id`),
  CONSTRAINT `questions_ibfk_1` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`quiz_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `questions`
--

LOCK TABLES `questions` WRITE;
/*!40000 ALTER TABLE `questions` DISABLE KEYS */;
INSERT INTO `questions` VALUES ('QS_001','QZ_01','Tên gọi khác phổ biến nhất của Tết Nguyên Đán là gì?',15,1000),('QS_002','QZ_01','Vị thần nào cưỡi cá chép bay về trời báo cáo Ngọc Hoàng vào ngày 23 tháng Chạp?',15,1000),('QS_003','QZ_01','Hoa đặc trưng không thể thiếu cho ngày Tết ở miền Nam là hoa gì?',10,1000),('QS_004','QZ_01','Trái cây nào sau đây KHÔNG thuộc mâm ngũ quả truyền thống miền Nam?',20,1500),('QS_005','QZ_01','Bao lì xì ngày Tết thường có màu gì để tượng trưng cho sự may mắn, tài lộc?',10,800),('QS_006','QZ_01','Theo dân gian, loài chim nào xuất hiện báo hiệu mùa xuân về?',15,1000),('QS_007','QZ_01','Ngày mùng 1 Tết, người dân thường kiêng kỵ hành động nào nhất?',20,1500),('QS_008','QZ_01','Câu chúc \"Sống lâu trăm tuổi\" thường được ưu tiên dành cho đối tượng nào?',10,800),('QS_009','QZ_01','Theo quan niệm xưa, ngày mùng 3 Tết được xem là ngày Tết của ai?',15,1200),('QS_010','QZ_01','Hoạt động nào thường được thực hiện ngay đúng khoảnh khắc Giao thừa?',15,1000),('QS_011','QZ_02','Bánh chưng truyền thống của người Việt có hình dáng gì?',10,800),('QS_012','QZ_02','Món canh khổ qua nhồi thịt ngày Tết ở miền Nam mang ý nghĩa sâu xa gì?',20,1500),('QS_013','QZ_02','Bánh tét ở miền Nam thường được gói bằng loại lá gì?',15,1000),('QS_014','QZ_02','Món thịt kho tàu ngày Tết thường gồm hai nguyên liệu chính nào?',15,1000),('QS_015','QZ_02','Củ kiệu chua ngọt thường được ăn kèm hoàn hảo nhất với món gì?',20,1200),('QS_016','QZ_02','Loại mứt nào có vị cay nồng đặc trưng, giúp ấm bụng trong những ngày đầu năm?',15,1000),('QS_017','QZ_02','Loại hạt gì có vỏ màu đỏ tươi, thường được cắn lách tách nhâm nhi trong dịp Tết?',10,800),('QS_018','QZ_02','Miền Bắc ngày Tết không thể thiếu món xôi có màu đỏ rực rỡ mang tên là gì?',15,1000),('QS_019','QZ_02','Giò thủ (giò xào) được làm chủ yếu từ bộ phận nào của con heo?',20,1500),('QS_020','QZ_02','Món \"Thịt đông\" là món ăn đặc trưng ngày Tết của vùng miền nào?',15,1000);
/*!40000 ALTER TABLE `questions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quizzes`
--

DROP TABLE IF EXISTS `quizzes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quizzes` (
  `quiz_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `creator_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_template` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`quiz_id`),
  KEY `creator_id` (`creator_id`),
  CONSTRAINT `quizzes_ibfk_1` FOREIGN KEY (`creator_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quizzes`
--

LOCK TABLES `quizzes` WRITE;
/*!40000 ALTER TABLE `quizzes` DISABLE KEYS */;
INSERT INTO `quizzes` VALUES ('QZ_01','Tết Sum Vầy - Phong Tục Truyền Thống','USR_01',1,'2026-03-08 15:40:05'),('QZ_02','Tết Sum Vầy - Ẩm Thực Ngày Xuân','USR_01',1,'2026-03-08 15:40:05');
/*!40000 ALTER TABLE `quizzes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('USR_01','MinhLe','MinhLe123','Minh Lê','2026-03-08 15:40:05'),('USR_02','VoVu','VoVu123','Võ Vũ','2026-03-08 15:40:05'),('USR_03','NgocNhi','NgocNhi123','Ngọc Nhi','2026-03-08 15:40:05');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-08 23:22:30

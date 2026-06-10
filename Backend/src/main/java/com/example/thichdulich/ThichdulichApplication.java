package com.example.thichdulich;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ThichdulichApplication {

	public static void main(String[] args) {
		SpringApplication.run(ThichdulichApplication.class, args);
	}

}

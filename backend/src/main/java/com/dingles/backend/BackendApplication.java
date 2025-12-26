package com.dingles.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import javax.sql.DataSource;
import java.util.Scanner;

/**
 * Launcher for database access backend.
 *
 * @author Pierce Davis
 * @version 1.0.0
 */
@SpringBootApplication
public class BackendApplication {
	static String username;
	static String password;
	/**
	 * Initialize the backend server.
	 *
	 * @param args Command line arguments.
	 */
	public static void main(String[] args) {
		// Get user credentials.
		if (args.length < 1) {
			// No credentials provided, request information.
			Scanner credientialsScanner = new Scanner(System.in);

			System.out.println("Please enter your credentials for the MySQL database.");
			System.out.print("Username: ");
			username = credientialsScanner.nextLine();
		}
		else {
			// Credentials provided.
			username = args[0];
		}

		// Initialize Spring
		dataSource();
		SpringApplication.run(BackendApplication.class, args);
	}

	/**
	 * Set MySQL access parameters
	 *
	 * @return Driver Manager (unused).
	 */
	@Bean
	public static DriverManagerDataSource dataSource() {
		DriverManagerDataSource dataSource = new DriverManagerDataSource();
		dataSource.setDriverClassName("com.mysql.cj.jdbc.Driver");
		dataSource.setUrl("jdbc:mysql://localhost:3306/dingles");
		dataSource.setUsername(username);
		return dataSource;
	}

	/**
	 * Get the template for executing database queries.
	 *
	 * @param dataSource Datasource (automatically handled by spring beans).
	 * @return JdbcTemplate.
	 */
	@Bean
	public static JdbcTemplate jdbcTemplate(DataSource dataSource) {
		return new JdbcTemplate(dataSource);
	}
}

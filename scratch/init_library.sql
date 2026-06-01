CREATE TABLE IF NOT EXISTS library_books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    isbn VARCHAR(50),
    genre VARCHAR(100),
    publisher VARCHAR(255),
    year INT,
    copies INT DEFAULT 1,
    available INT DEFAULT 1,
    shelf VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS library_issues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    member_id VARCHAR(50) NOT NULL,
    member_name VARCHAR(100) NOT NULL,
    member_class VARCHAR(50),
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE,
    status VARCHAR(50) DEFAULT 'Active',
    FOREIGN KEY (book_id) REFERENCES library_books(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS library_fines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    issue_id INT NOT NULL,
    amount DECIMAL(10, 2) DEFAULT 0.00,
    status ENUM('Pending', 'Paid') DEFAULT 'Pending',
    paid_date DATE,
    FOREIGN KEY (issue_id) REFERENCES library_issues(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS library_notices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    type VARCHAR(50),
    date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

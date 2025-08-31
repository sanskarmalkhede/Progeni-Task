-- User Profile Management Database 

-- Create the users table with all required fields
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone_number VARCHAR(20),
  bio TEXT,
  avatar_url VARCHAR(500),
  date_of_birth DATE,
  location VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on row updates
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO users (full_name, email, phone_number, bio, avatar_url, date_of_birth, location) VALUES
('John Doe', 'john.doe@example.com', '+1-555-0123', 'Software developer with 5 years of experience in React and Node.js', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', '1988-03-15', 'San Francisco, CA'),
('Jane Smith', 'jane.smith@example.com', '+1-555-0124', 'UX designer passionate about user-centered design and accessibility', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150', '1992-07-22', 'New York, NY'),
('Mike Johnson', 'mike.johnson@example.com', '+1-555-0125', 'Product manager with a background in engineering and data analysis', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', '1985-11-08', 'Austin, TX'),
('Sarah Wilson', 'sarah.wilson@example.com', '+1-555-0126', 'Full-stack developer specializing in modern web technologies', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', '1990-05-12', 'Seattle, WA'),
('David Brown', 'david.brown@example.com', '+1-555-0127', 'DevOps engineer with expertise in cloud infrastructure and automation', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', '1987-09-30', 'Denver, CO');

-- Verify the table was created successfully
SELECT 'Table created successfully!' as status;
SELECT COUNT(*) as total_users FROM users;
SELECT * FROM users LIMIT 3;
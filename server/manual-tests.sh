# =====================================================
# MANUAL TEST COMMANDS - Copy & Paste Individually
# =====================================================
# Server must be running: npm run dev

# =====================================================
# TEST 1: Check Server
# =====================================================
curl.exe http://localhost:5000


# =====================================================
# TEST 2: Valid Registration
# =====================================================
curl.exe -X POST http://localhost:5000/api/register -H "Content-Type: application/json" -d @- << 'EOF'
{
  "username": "validuser",
  "email": "valid@example.com",
  "password": "ValidPass123"
}
EOF


# =====================================================
# TEST 3: Invalid Email
# =====================================================
curl.exe -X POST http://localhost:5000/api/register -H "Content-Type: application/json" -d @- << 'EOF'
{
  "username": "testuser",
  "email": "not-an-email",
  "password": "Test1234"
}
EOF


# =====================================================
# TEST 4: Weak Password
# =====================================================
curl.exe -X POST http://localhost:5000/api/register -H "Content-Type: application/json" -d @- << 'EOF'
{
  "username": "testuser",
  "email": "test@test.com",
  "password": "weak"
}
EOF


# =====================================================
# TEST 5: Short Username
# =====================================================
curl.exe -X POST http://localhost:5000/api/register -H "Content-Type: application/json" -d @- << 'EOF'
{
  "username": "ab",
  "email": "test@test.com",
  "password": "Test1234"
}
EOF


# =====================================================
# TEST 6: Login with Wrong Password (Repeat 6 times)
# =====================================================
curl.exe -X POST http://localhost:5000/api/login -H "Content-Type: application/json" -d @- << 'EOF'
{
  "username": "testuser",
  "password": "wrongpassword1"
}
EOF

# Run this same command 5 more times to trigger rate limiting
# 6th attempt should show: "Too many login attempts..."


# =====================================================
# TEST 7: Invalid OTP
# =====================================================
curl.exe -X POST http://localhost:5000/api/verify-otp -H "Content-Type: application/json" -d @- << 'EOF'
{
  "email": "valid@example.com",
  "otp": "999999"
}
EOF

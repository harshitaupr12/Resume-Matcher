import os
import sqlite3

# Check if database file exists before trying to remove it
if os.path.exists('resume_matcher.db'):
    os.remove('resume_matcher.db')
    print("Old database removed")
else:
    print("No existing database found")

print("New database will be created when you restart the backend")
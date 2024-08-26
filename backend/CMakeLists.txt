cmake_minimum_required(VERSION 3.10)

project(PokemonSimBackend)

set(CMAKE_CXX_STANDARD 17)

# Include FetchContent module
include(FetchContent)

# Fetch Crow from GitHub
FetchContent_Declare(
  crow
  GIT_REPOSITORY https://github.com/CrowCpp/Crow.git
  GIT_TAG v1.0  
)

FetchContent_MakeAvailable(crow)

include_directories(${CMAKE_SOURCE_DIR}/include)

# Find Boost
cmake_policy(SET CMP0167 NEW)
find_package(Boost 1.70 REQUIRED COMPONENTS system)

if(Boost_FOUND)
    include_directories(${Boost_INCLUDE_DIRS})
endif()

# Find SQLite3
find_package(SQLite3 REQUIRED)
include_directories(${SQLITE3_INCLUDE_DIRS})

# Add the source files
add_executable(PokemonSimBackend 
    server.cpp 
    src/SinglesMatch.cpp 
    src/Trainer.cpp
)

# Link Crow, Boost, and SQLite3 libraries
target_link_libraries(PokemonSimBackend crow Boost::system SQLite::SQLite3)

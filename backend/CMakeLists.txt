cmake_minimum_required(VERSION 3.10)

project(PokemonSimBackend)

set(CMAKE_CXX_STANDARD 17)

# Add Crow and your other include directories
include_directories(${CMAKE_SOURCE_DIR}/Crow/include)
include_directories(${CMAKE_SOURCE_DIR}/include)

# Add the path to the installed ASIO headers
include_directories(/opt/homebrew/Cellar/asio/1.30.2/include)

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

# Link Boost and SQLite3 Libraries
target_link_libraries(PokemonSimBackend Boost::system SQLite::SQLite3)

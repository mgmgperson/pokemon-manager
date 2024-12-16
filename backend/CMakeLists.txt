cmake_minimum_required(VERSION 3.10)
project(PokemonSimBackend VERSION 1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# For CMP0167
cmake_policy(SET CMP0167 NEW)

include(FetchContent)

# --- Fetch Crow ---
FetchContent_Declare(
  crow
  GIT_REPOSITORY https://github.com/CrowCpp/Crow.git
  GIT_TAG v1.0
)
FetchContent_MakeAvailable(crow)

# --- Find Boost ---
find_package(Boost REQUIRED COMPONENTS system)

# --- Find SQLite3 ---
find_package(SQLite3 REQUIRED)

# --- Find JsonCpp ---
find_package(JsonCpp REQUIRED)

# --- Add executable ---
add_executable(PokemonSimBackend 
    server.cpp
    src/SinglesMatch.cpp
    src/Trainer.cpp
    src/PythonRunner.cpp
    src/MentalRating.cpp
    src/Rating.cpp
)

# --- Link libraries ---
target_link_libraries(PokemonSimBackend 
    PRIVATE
        Crow::Crow            # Correct Crow target
        Boost::system         # from find_package(Boost)
        SQLite::SQLite3       # from find_package(SQLite3)
        JsonCpp::JsonCpp      # from find_package(JsonCpp)
)

# Optionally set include directories if needed:
# But usually the imported targets above do that automatically.
# If you have your own "include/" folder with *.h for your project:
target_include_directories(PokemonSimBackend
    PRIVATE
        ${CMAKE_SOURCE_DIR}/include
)
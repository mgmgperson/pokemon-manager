#include "PythonRunner.h"
#include <cstdlib>
#include <fstream>
#include <sstream>
#include <iostream>
#include <stdexcept>

Json::Value PythonRunner::runPythonGenerator(int overallRating, const std::string& ratingType) {
    // For example, generator.py expects 2 arguments: overall_rating and rating_type
    // e.g. "python3 ../python/generator.py 85 mental"
    std::string pythonScriptPath = "../python/generator.py";

    // Build the command with two arguments
    std::ostringstream command;
    command << "python3 " << pythonScriptPath << " " << overallRating << " " << ratingType;

    // Open a pipe to run the command
    FILE* pipe = popen(command.str().c_str(), "r");
    if (!pipe) {
        throw std::runtime_error("Failed to run Python script: " + command.str());
    }

    // Read the output from the Python script
    std::ostringstream outputJson;
    char buffer[128];
    while (fgets(buffer, sizeof(buffer), pipe)) {
        outputJson << buffer;
    }

    pclose(pipe);

    // Parse JSON output
    Json::Value jsonData;
    std::istringstream iss(outputJson.str());
    try {
        iss >> jsonData;
    } catch (std::exception& e) {
        std::cerr << "JSON parse error: " << e.what() 
                  << "\nOutput was: " << outputJson.str() << std::endl;
        throw std::runtime_error("JSON parse error in PythonRunner::runPythonGenerator.");
    }
    return jsonData;
}

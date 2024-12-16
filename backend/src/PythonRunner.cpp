#include "PythonRunner.h"
#include <cstdlib>
#include <fstream>
#include <sstream>
#include <iostream>
#include <stdexcept>

Json::Value PythonRunner::runPythonGenerator(int overallRating) {
    std::string pythonScriptPath = "../python/generator.py";

    // Build the command
    std::ostringstream command;
    command << "python3 " << pythonScriptPath << " " << overallRating;

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
        std::cerr << "JSON parse error: " << e.what() << "\nOutput was: " << outputJson.str() << std::endl;
    }
    return jsonData;
}

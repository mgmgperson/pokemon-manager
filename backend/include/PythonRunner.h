#ifndef PYTHON_RUNNER_H
#define PYTHON_RUNNER_H

#include <string>
#include <json/json.h> 

class PythonRunner {
public:
    static Json::Value runPythonGenerator(int overallRating, const std::string& ratingType);
};

#endif

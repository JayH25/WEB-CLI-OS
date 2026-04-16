#include <exception>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

namespace {
std::vector<std::string> virtualFiles;
}  // namespace

auto main() -> int {
    try {
        std::string line;
        std::string command;
        std::string argument;

        while (true) {
            if (!std::getline(std::cin, line)) {
                break;
            }

            if (line.empty()) {
                continue;
            }

            std::stringstream stream(line);
            stream >> command >> argument;

            if (command == "exit") {
                break;
            }

            if (command == "mkdir") {
                if (argument.empty()) {
                    std::cout << "Error: Folder name required\n";
                } else {
                    virtualFiles.push_back(argument);
                    std::cout << "Created folder: " << argument << '\n';
                }
            } else if (command == "ls") {
                if (virtualFiles.empty()) {
                    std::cout << "Directory is empty.\n";
                } else {
                    for (const std::string& fileName : virtualFiles) {
                        std::cout << fileName << ' ';
                    }
                    std::cout << '\n';
                }
            } else {
                std::cout << "Command not recognized: " << command << '\n';
            }

            std::cout << "===END_OF_COMMAND===\n";
        }
    } catch (const std::exception& exception) {
        std::cout << "Engine error: " << exception.what() << '\n';
        return 1;
    }

    return 0;
}
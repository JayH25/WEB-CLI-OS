#include <iostream>
#include <vector>
#include <sstream>
using namespace std;

vector<string> virtualFiles;

int main() {
    string line, command, argument;

    while (true) {
        // Read full line input
        getline(cin, line);

        // Skip empty input
        if (line.empty()) continue;

        // Parse input
        stringstream ss(line); // It is used to extract words in the string line, one by one, using '>>' 
        ss >> command >> argument; // extracts one word, at a time

        // Exit condition
        if (command == "exit") {
            break;
        }

        // mkdir command
        if (command == "mkdir") { // mkdir argumentName
            if (argument.empty()) {  // argument cannot be empty
                cout << "Error: Folder name required" << endl;
            } else {
                virtualFiles.push_back(argument);
                cout << "Created folder: " << argument << endl;
            }
        }

        // ls command
        else if (command == "ls") {
            if (virtualFiles.empty()) {
                cout << "Directory is empty." << endl;
            } else {
                for (const auto &file : virtualFiles) {
                    cout << file << " ";
                }
                cout << endl;
            }
        }

        // Unknown command
        else {
            cout << "Command not recognized: " << command << endl;
        }

        // Signal end of command (important for your frontend)
        cout << "===END_OF_COMMAND===" << endl;
    }

    return 0;
}
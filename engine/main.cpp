#include <iostream>
#include <sstream>
#include <string>
#include <vector>
#include <unordered_map>
#include <memory>

using namespace std;

// ==========================================
// 1.Node Class
// ==========================================
class FileNode {
private:
    std::string name;
    std::string type; // "directory" or "file"
    std::string content;
    std::unordered_map<std::string, std::shared_ptr<FileNode>> children;
    std::weak_ptr<FileNode> parent;

public:
    FileNode(std::string n, std::string t) : name(n), type(t) {}

    // Getters
    std::string getName() const { return name; }
    std::string getType() const { return type; }
    std::string getContent() const { return content; }

    // Setters
    void setName(const std::string& n) { name = n; }
    void setContent(const std::string& c) { content = c; }
    void setParent(std::shared_ptr<FileNode> p) { parent = p; }

    // Tree Operations
    void addChild(std::shared_ptr<FileNode> child) {
        children[child->getName()] = child;
    }

    void removeChild(const std::string& childName) {
        children.erase(childName);
    }

    bool hasChild(const std::string& childName) const {
        return children.find(childName) != children.end();
    }

    std::shared_ptr<FileNode> getChild(const std::string& childName) {
        if (hasChild(childName)) {
            return children[childName];
        }
        return nullptr;
    }

    const std::unordered_map<std::string, std::shared_ptr<FileNode>>& getChildren() const {
        return children;
    }
};

// ==========================================
// 2. The FileSystem Class
// ==========================================
class FileSystem {
private:
    std::shared_ptr<FileNode> root;
    std::string cwd; // Current Working Directory

    // Helper: Parses paths like "/home/../etc" into {"etc"}
    std::vector<std::string> parsePath(const std::string& inputPath) {
        std::string fullPath = (inputPath.find('/') == 0) ? inputPath : (cwd + "/" + inputPath);
        std::vector<std::string> parts;
        std::stringstream ss(fullPath);
        std::string part;
        
        while (std::getline(ss, part, '/')) {
            if (part == "" || part == ".") continue;
            if (part == "..") {
                if (!parts.empty()) parts.pop_back();
            } else {
                parts.push_back(part);
            }
        }
        return parts;
    }

    // Helper: Finds a node given parsed parts (e.g., {"home", "user"})
    std::shared_ptr<FileNode> resolveNode(const std::vector<std::string>& parts) {
        auto current = root;
        for (const auto& part : parts) {
            if (current->getType() != "directory") return nullptr;
            if (!current->hasChild(part)) return nullptr;
            current = current->getChild(part);
        }
        return current;
    }

public:
    FileSystem() {
        root = std::make_shared<FileNode>("/", "directory");
        cwd = "/home/user";

        // Build Default Structure
        createDir("/home");
        createDir("/home/user");
        createDir("/etc");
        createDir("/tmp");
        createDir("/bin");
    }
    std::string getCwd() const {
        return cwd;
    }

    // 1. getNode(path)
    std::shared_ptr<FileNode> getNode(const std::string& path) {
        return resolveNode(parsePath(path));
    }

    // 2. createFile(path, content)
    std::string createFile(const std::string& path, const std::string& content) {
        auto parts = parsePath(path);
        if (parts.empty()) return "Error: Invalid file name";

        std::string fileName = parts.back();
        parts.pop_back();

        auto parentNode = resolveNode(parts);
        if (!parentNode) return "Error: Parent directory does not exist";
        if (parentNode->getType() != "directory") return "Error: Parent is not a directory";
        if (parentNode->hasChild(fileName)) return "Error: File already exists";

        auto newFile = std::make_shared<FileNode>(fileName, "file");
        newFile->setContent(content);
        newFile->setParent(parentNode);
        parentNode->addChild(newFile);
        
        return "Created file: " + fileName;
    }

    // 3. createDir(path)
    std::string createDir(const std::string& path) {
        auto parts = parsePath(path);
        if (parts.empty()) return "Error: Invalid directory name";

        std::string dirName = parts.back();
        parts.pop_back();

        auto parentNode = resolveNode(parts);
        if (!parentNode) return "Error: Parent directory does not exist";
        if (parentNode->getType() != "directory") return "Error: Parent is not a directory";
        if (parentNode->hasChild(dirName)) return "Error: Directory already exists";

        auto newDir = std::make_shared<FileNode>(dirName, "directory");
        newDir->setParent(parentNode);
        parentNode->addChild(newDir);
        
        return "Created directory: " + dirName;
    }

    // 4. deleteNode(path)
    std::string deleteNode(const std::string& path) {
        auto parts = parsePath(path);
        if (parts.empty()) return "Error: Cannot delete root directory";

        std::string nodeName = parts.back();
        parts.pop_back();

        auto parentNode = resolveNode(parts);
        if (!parentNode) return "Error: Parent directory does not exist";
        if (!parentNode->hasChild(nodeName)) return "Error: No such file or directory";

        parentNode->removeChild(nodeName);
        return "Deleted: " + nodeName;
    }

    // 5. moveNode(src, dest)
    std::string moveNode(const std::string& src, const std::string& dest) {
        auto srcParts = parsePath(src);
        if (srcParts.empty()) return "Error: Cannot move root directory";
        std::string srcName = srcParts.back();
        srcParts.pop_back();
        
        auto srcParent = resolveNode(srcParts);
        if (!srcParent || !srcParent->hasChild(srcName)) return "Error: Source does not exist";
        auto nodeToMove = srcParent->getChild(srcName);

        auto destParts = parsePath(dest);
        if (destParts.empty()) return "Error: Invalid destination";
        std::string destName = destParts.back();
        destParts.pop_back();

        auto destParent = resolveNode(destParts);
        if (!destParent) return "Error: Destination directory does not exist";
        if (destParent->getType() != "directory") return "Error: Destination is not a directory";
        if (destParent->hasChild(destName)) return "Error: Destination already exists";

        // Remove from old parent, update name/parent, and add to new parent
        srcParent->removeChild(srcName); 
        nodeToMove->setName(destName); 
        nodeToMove->setParent(destParent); 
        destParent->addChild(nodeToMove);  

        return "Moved to " + dest;
    }

    // 6. listDir(path)
    std::string listDir(const std::string& path) {
        std::string targetPath = path.empty() ? cwd : path;
        auto parts = parsePath(targetPath);
        auto node = resolveNode(parts);

        if (!node) return "Error: No such file or directory";
        if (node->getType() != "directory") return "Error: Not a directory";
        
        const auto& children = node->getChildren();
        if (children.empty()) return "Directory is empty.";

        std::string output = "";
        for (const auto& pair : children) {
            if (pair.second->getType() == "directory") {
                output +=pair.first + "\n"; // Show folders in brackets
            } else {
                output += pair.first + " ";
            }
        }
        return output;
    }

    // Optional utility: If you want to support a `cd` command so relative paths work from the user's terminal
    std::string changeDir(const std::string& path) {
        auto parts = parsePath(path);
        auto node = resolveNode(parts);

        if (!node) return "Error: No such file or directory";
        if (node->getType() != "directory") return "Error: Not a directory";

        cwd = "";
        for (const auto& part : parts) {
            cwd += "/" + part;
        }
        if (cwd.empty()) cwd = "/";
        return ""; 
    }
};



int main() {
    //Initialize the File System 
    FileSystem vfs;

    try {
        std::string line;
        std::string command;
        // Notice: argument and argument2 are completely removed from here!

        while (true) {
            if (!std::getline(std::cin, line)) {
                break;
            }

            if (line.empty()) continue;

            std::stringstream stream(line);
            stream >> command;
            
            // Extract all remaining arguments into a vector
            std::vector<std::string> args;
            std::string arg;
            while (stream >> arg) {
                args.push_back(arg);
            }

            if (command == "exit") {
                break;
            }
            
            // 2. Route commands to our new VFS methods USING THE VECTOR (args)
            if (command == "mkdir") {
                if (args.empty()) {
                    std::cout << "Error: Folder name required\n";
                } else {
                    std::cout << vfs.createDir(args[0]) << '\n';
                }
            } 
            else if (command == "ls") {
                std::string target = args.empty() ? "" : args[0];
                std::string result = vfs.listDir(target);
                if (result.empty()) {
                    std::cout << "Directory is empty.\n";
                } else {
                    std::cout << result << '\n';
                }
            }
            else if (command == "cd") {
                std::string target = args.empty() ? "/home/user" : args[0]; // Default cd goes to home
                std::string result = vfs.changeDir(target);
                if (!result.empty()) {
                    std::cout << result << '\n';
                }
            }
            else if (command == "mv") {
                if (args.size() < 2) {
                    std::cout << "Error: Source and destination required\n";
                } else {
                    std::cout << vfs.moveNode(args[0], args[1]) << '\n';
                }
            }
            else if (command == "pwd") {
                // Make sure you added std::string getCwd() const { return cwd; } inside the FileSystem class!
                std::cout << vfs.getCwd() << '\n';
            }
            else if (command == "touch") {
                if (args.empty()) {
                    std::cout << "Error: File name required\n";
                } else {
                    std::cout << vfs.createFile(args[0], "") << '\n';
                }
            }
            else if (command == "rm") {
                if (args.empty()) {
                    std::cout << "Error: Target required\n";
                } else {
                    std::cout << vfs.deleteNode(args[0]) << '\n';
                }
            }
            else {
                std::cout << "Command not recognized: " << command << '\n';
            }

            // Keep the end of command marker for Node.js backend
            std::cout << "===END_OF_COMMAND===\n";
        }
    } catch (const std::exception& exception) {
        std::cout << "Engine error: " << exception.what() << '\n';
        return 1;
    }

    return 0;
}

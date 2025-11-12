import { CopyCheckIcon, CopyIcon } from "lucide-react";
import { useState, useMemo, useCallback, Fragment } from "react";

import { Hint } from "@/components/ui/hint";
import { Button } from "@/components/ui/button";
import { CodeView } from "./ui/code-view";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { TreeView } from "./tree-view";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";

type FileCollection = { [path: string]: string };

function getLanguageFromExtension(filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase();
  return extension || "text";
}

interface FileBreadcrumbProps {
  filePath: string;
}

const FileBreadcrumb = ({ filePath }: FileBreadcrumbProps) => {
  const pathSegments = filePath.split("/");
  const maxSegments = 3;
  
  const renderBreadcrumbItems = () => {
    if (pathSegments.length <= maxSegments) {
      // Show all segments if 3 or less
      return pathSegments.map((segment, index) => {
        const isLast = index === pathSegments.length - 1;
        return (
          <Fragment key={index}>
            <BreadcrumbItem>
              {isLast ? (
                <BreadcrumbPage className="font-medium">
                  {segment}
                </BreadcrumbPage>
              ) : (
                <span className="text-muted-foreground">{segment}</span>
              )}
            </BreadcrumbItem>
            {!isLast && <BreadcrumbSeparator />}
          </Fragment>
        );
      });
    } else {
      const firstSegment = pathSegments[0];
      const lastSegments = pathSegments[pathSegments.length - 1]; // Fixed: length not lenght
      return (
        <>
          <BreadcrumbItem>
            <span className="text-muted-foreground">{firstSegment}</span>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbEllipsis />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-medium">
              {lastSegments}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </>
      );
    }
  };

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {renderBreadcrumbItems()}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

// Convert files object to array-based tree structure
function convertFilesToTreeItems(files: FileCollection): any {
  const tree: { [key: string]: any } = {};

  // Build the tree structure
  Object.keys(files)
    .sort()
    .forEach((filePath) => {
      const parts = filePath.split("/").filter(Boolean);
      let current = tree;

      parts.forEach((part, index) => {
        const isFile = index === parts.length - 1;

        if (isFile) {
          // Store the FULL file path as the value
          current[part] = filePath;
        } else {
          // Create folder if it doesn't exist
          if (!current[part] || typeof current[part] === "string") {
            current[part] = {};
          }
          current = current[part];
        }
      });
    });

  // Convert object tree to array format [name, children...]
  function objectToArray(obj: any, name?: string): any {
    if (typeof obj === "string") {
      // It's a file - return just the filename (the full path is stored in the tree)
      return name;
    }

    // It's a folder - return [name, ...children]
    const children = Object.keys(obj)
      .sort()
      .map((key) => objectToArray(obj[key], key));

    return name ? [name, ...children] : children;
  }

  return objectToArray(tree);
}

interface FileExplorerProps {
  files: FileCollection;
}

export const FileExplorer = ({ files }: FileExplorerProps) => {
  const [copied, setCopied] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(() => {
    const fileKeys = Object.keys(files);
    return fileKeys.length > 0 ? fileKeys[0] : null;
  });

  const handleCopy = useCallback(() => {
    if (selectedFile) {
      navigator.clipboard.writeText(files[selectedFile]);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  }, [selectedFile, files]);

  const treeData = useMemo(() => {
    console.log("Files object:", files);
    const data = convertFilesToTreeItems(files);
    console.log("Converted tree data:", data);
    return data;
  }, [files]);

  const handleFileSelect = useCallback(
    (filePath: string) => {
      console.log("=== FILE SELECT DEBUG ===");
      console.log("Selected path:", filePath);
      console.log("File exists in files object:", !!files[filePath]);
      console.log("All available file keys:", Object.keys(files));
      console.log("File content:", files[filePath] ? "EXISTS" : "MISSING");

      if (files[filePath]) {
        setSelectedFile(filePath);
      } else {
        console.error("❌ File not found:", filePath);
      }
    },
    [files]
  );

  console.log("Current selected file:", selectedFile);
  console.log("Selected file exists:", !!files[selectedFile || ""]);

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={30} minSize={30} className="bg-sidebar">
        <TreeView
          data={treeData}
          value={selectedFile ?? undefined}
          onSelect={handleFileSelect}
        />
      </ResizablePanel>
      <ResizableHandle className="hover:bg-primary transition-colors" />
      <ResizablePanel>
        {selectedFile && files[selectedFile] ? (
          <div className="h-full w-full flex flex-col">
            <div className="border-b bg-sidebar px-4 py-2 flex justify-between items-center gap-x-2">
              <FileBreadcrumb filePath={selectedFile} />
              <Hint text="Copy to clipboard" side="bottom">
                <Button
                  variant="outline"
                  size="icon"
                  className="ml-auto"
                  onClick={handleCopy}
                  disabled={copied}
                >
                  {copied ? <CopyCheckIcon /> : <CopyIcon />}
                </Button>
              </Hint>
            </div>
            <div className="flex-1 overflow-auto">
              <CodeView
                code={files[selectedFile]}
                lang={getLanguageFromExtension(selectedFile)}
              />
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            {selectedFile
              ? `File not found: ${selectedFile}`
              : "Select a file to view its contents"}
          </div>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};
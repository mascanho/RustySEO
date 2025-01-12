"use client";

import { useState, useMemo } from "react";
import { TableData, mockData } from "./utils/tableData";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Search,
  Edit,
  Trash,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import React from "react";

const ITEMS_PER_PAGE = 20;

export default function FilteredTable() {
  const [data, setData] = useState<TableData[]>(mockData);
  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState<keyof TableData | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    return data.filter((item) =>
      Object.values(item).some((value) =>
        value.toString().toLowerCase().includes(search.toLowerCase()),
      ),
    );
  }, [data, search]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleSort = (column: keyof TableData) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }

    const sortedData = [...data].sort((a, b) => {
      if (a[column] < b[column]) return sortDirection === "asc" ? -1 : 1;
      if (a[column] > b[column]) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    setData(sortedData);
  };

  const toggleDetails = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleEdit = (id: string) => {
    console.log(`Edit item with id: ${id}`);
  };

  const handleDelete = (id: string) => {
    console.log(`Delete item with id: ${id}`);
  };

  const handleViewDetails = (id: string) => {
    toggleDetails(id);
  };

  return (
    <div className="container mx-auto p-4 bg-transparent rounded-lg shadow-none ">
      <h2 className="mb-4 text-xl font-semibold">Google Search Console</h2>
      <div className="mb-4 relative">
        <Input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={handleSearch}
          className="pl-10 pr-4 py-2 border rounded-md w-full"
        />
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={20}
        />
      </div>
      <div className="overflow-x-auto h-[calc(100vh-240px) ]">
        <Table>
          <TableHeader className="sticky top-0 bg-blue-50">
            <TableRow>
              {Object.keys(mockData[0])
                .filter((key) => key !== "id")
                .map((key) => (
                  <TableHead
                    key={key}
                    className="cursor-pointer hover:bg-blue-100 transition-colors"
                    onClick={() => handleSort(key as keyof TableData)}
                  >
                    <div className="flex items-center">
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                      {sortColumn === key &&
                        (sortDirection === "asc" ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        ))}
                    </div>
                  </TableHead>
                ))}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((item) => (
              <React.Fragment key={item.id}>
                <TableRow className="border-b">
                  <TableCell>{item.keyword}</TableCell>
                  <TableCell>{item.clicks}</TableCell>
                  <TableCell>{item.url}</TableCell>
                  <TableCell>{item.impressions}</TableCell>
                  <TableCell>{item.ctr}%</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleViewDetails(item.id)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          <span>View Details</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(item.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(item.id)}>
                          <Trash className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                {expandedRow === item.id && (
                  <TableRow key={`${item.id}-expanded`}>
                    <TableCell colSpan={6}>
                      <div className="p-4 bg-blue-50 rounded-md">
                        <h4 className="font-semibold mb-2">
                          Additional Details
                        </h4>
                        <p>Keyword: {item.keyword}</p>
                        <p>URL: {item.url}</p>
                        <p>Clicks: {item.clicks}</p>
                        <p>Impressions: {item.impressions}</p>
                        <p>CTR: {item.ctr}%</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
          {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} of{" "}
          {filteredData.length} results
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((page) => Math.min(totalPages, page + 1))
            }
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

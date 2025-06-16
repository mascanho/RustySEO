// @ts-nocheck
"use client"
import type React from "react"
import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import debounce from "lodash/debounce"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { initialColumnWidths, initialColumnAlignments, headerTitles } from "./tableLayout"
import { TbColumns3 } from "react-icons/tb"
import DownloadButton from "./DownloadButton"
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore"
import { invoke } from "@tauri-apps/api/core"
import { save } from "@tauri-apps/plugin-dialog"
import { writeFile } from "@tauri-apps/plugin-fs"
import { toast } from "sonner"

interface TruncatedCellProps {
  text: string
  maxLength?: number
  width?: string
}

interface ResizableDividerProps {
  onMouseDown: (event: React.MouseEvent) => void
}

interface TableHeaderProps {
  headers: string[]
  columnWidths: string[]
  columnAlignments: string[]
  onResize: (index: number, event: React.MouseEvent) => void
  onAlignToggle: (index: number) => void
  columnVisibility: boolean[]
}

interface TableRowProps {
  row: any[]
  index: number
  columnWidths: string[]
  columnAlignments: string[]
  columnVisibility: boolean[]
  clickedCell: { row: number | null; cell: number | null }
  handleCellClick: (rowIndex: number, cellIndex: number, cellContent: string) => void
}

interface ColumnPickerProps {
  columnVisibility: boolean[]
  setColumnVisibility: (visibility: boolean[]) => void
  headerTitles: string[]
}

interface TableCrawlProps {
  rows: any[]
  rowHeight?: number
  overscan?: number
  tabName: string
}

const TruncatedCell = ({ text, maxLength = 140, width = "auto" }: TruncatedCellProps) => {
  const truncatedText = useMemo(() => {
    if (!text) return ""
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
  }, [text, maxLength])

  return useMemo(
    () => (
      <div
        style={{
          width,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {truncatedText}
      </div>
    ),
    [width, truncatedText],
  )
}

const ResizableDivider = ({ onMouseDown }: ResizableDividerProps) => {
  return useMemo(
    () => (
      <div
        onMouseDown={onMouseDown}
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: "5px",
          cursor: "col-resize",
          zIndex: 1,
        }}
      />
    ),
    [onMouseDown],
  )
}

const TableHeader = ({
  headers,
  columnWidths,
  columnAlignments,
  onResize,
  onAlignToggle,
  columnVisibility,
}: TableHeaderProps) => {
  return useMemo(
    () => (
      <thead className="sticky top-0 z-10 domainCrawl border">
        <tr>
          {headers.map((header, index) =>
            columnVisibility[index] ? (
              <th
                key={header}
                style={{
                  width: index === 0 ? "20px" : columnWidths[index],
                  position: "relative",
                  border: "1px solid #ddd",
                  padding: "8px",
                  userSelect: "none",
                  minWidth: index === 0 ? "20px" : columnWidths[index],
                  textAlign: columnAlignments[index],
                  backgroundColor: "var(--background, white)",
                }}
                className="dark:border-gray-600 dark:bg-gray-800 bg-gray-50"
                onClick={() => onAlignToggle(index)}
              >
                {header}
                <ResizableDivider onMouseDown={(e) => onResize(index, e)} />
              </th>
            ) : null,
          )}
        </tr>
      </thead>
    ),
    [headers, columnWidths, columnAlignments, onResize, onAlignToggle, columnVisibility],
  )
}

const TableRow = ({
  row,
  index,
  columnWidths,
  columnAlignments,
  columnVisibility,
  clickedCell,
  handleCellClick,
}: TableRowProps) => {
  const rowData = useMemo(
    () => [index + 1, row[1] || "", row[0] || "", row[2] + " KB" || "", row[3] || "", row[4] || ""],
    [row, index],
  )

  const isOdd = index % 2 === 1

  return useMemo(
    () => (
      <>
        {rowData.map((cell, cellIndex) =>
          columnVisibility[cellIndex] ? (
            <td
              key={`cell-${index}-${cellIndex}`}
              onClick={() => handleCellClick(index, cellIndex, cell.toString())}
              style={{
                width: cellIndex === 0 ? "30px" : columnWidths[cellIndex],
                border: "1px solid #ddd",
                padding: "8px",
                paddingLeft: cellIndex === 0 ? "20px" : "0px",
                textAlign: columnAlignments[cellIndex],
                overflow: "hidden",
                whiteSpace: "nowrap",
                minWidth: cellIndex === 0 ? "30px" : columnWidths[cellIndex],
                height: "25px",
                backgroundColor:
                  clickedCell.row === index && clickedCell.cell === cellIndex ? "#2B6CC4" : "transparent",
                color: clickedCell.row === index && clickedCell.cell === cellIndex ? "white" : "inherit",
              }}
              className={`dark:text-white/50 cursor-pointer dark:border-gray-600 ${
                isOdd ? "bg-gray-50 dark:bg-gray-800/50" : "bg-white dark:bg-gray-900"
              } hover:bg-blue-50 dark:hover:bg-blue-900/20`}
            >
              <TruncatedCell text={cell?.toString()} width={cellIndex === 0 ? "30px" : columnWidths[cellIndex]} />
            </td>
          ) : null,
        )}
      </>
    ),
    [rowData, columnWidths, columnAlignments, columnVisibility, index, clickedCell, handleCellClick, isOdd],
  )
}

const ColumnPicker = ({ columnVisibility, setColumnVisibility, headerTitles }: ColumnPickerProps) => {
  const handleToggle = useCallback(
    (index: number) => {
      setColumnVisibility((prev) => {
        const newVisibility = [...prev]
        newVisibility[index] = !newVisibility[index]
        return newVisibility
      })
    },
    [setColumnVisibility],
  )

  return useMemo(
    () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="border dark:border-white/20   w-8  flex  dark:hover:border-brand-bright dark:hover:border   justify-center items-center rounded h-6 hover:border-brand-bright cursor-pointer active:bg-brand-bright active:text-white">
            <TbColumns3 className="w-5 h-5 dark:text-white/50 p-1 " />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-32 bg-white text-black active:text-white dark:bg-brand-darker border dark:border-brand-dark rounded shadow-lg z-20">
          {headerTitles.map((header, index) => (
            <DropdownMenuCheckboxItem
              key={header}
              checked={columnVisibility[index] ?? true}
              onCheckedChange={() => handleToggle(index)}
              className="p-2 hover:bg-gray-100  dark:hover:bg-brand-dark space-x-6 dark:text-white text-black active:text-white hover:text-white w-full "
            >
              <span className="ml-5 dark:text-brand-bright">{header}</span>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    [columnVisibility, handleToggle, headerTitles],
  )
}

const ImagesCrawlTable = ({ rows, rowHeight = 25, overscan = 18, tabName }: TableCrawlProps) => {
  const [columnWidths, setColumnWidths] = useState(initialColumnWidths)
  const [columnAlignments, setColumnAlignments] = useState(initialColumnAlignments)
  const [isResizing, setIsResizing] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [columnVisibility, setColumnVisibility] = useState(headerTitles.map(() => true))

  const handleDownload = async () => {
    try {
      // Call the backend command to generate the Excel file

      if (!rows.length) {
        toast.error("No data to download, crawl something first")
        return
      }

      const fileBuffer = await invoke("create_excel", { data: rows })

      // Prompt the user to choose a file path to save the Excel file
      const filePath = await save({
        filters: [
          {
            name: "Excel File",
            extensions: ["xlsx"],
          },
        ],
        defaultPath: `RustySEO-${tabName}`, // Default file name
      })

      if (filePath) {
        // Convert the Uint8Array to a binary file and save it
        await writeFile(filePath, new Uint8Array(fileBuffer))
      } else {
        console.log("User canceled the save dialog.")
      }
    } catch (error) {
      console.error("Error generating or saving Excel file:", error)
    }
  }

  // State to track the clicked cell (rowIndex, cellIndex)
  const [clickedCell, setClickedCell] = useState<{
    row: number | null
    cell: number | null
  }>({
    row: null,
    cell: null,
  })
  const { setSelectedTableURL } = useGlobalCrawlStore()

  const filterTableURL = (arr: { url: string }[], url: string) => {
    if (!arr || arr.length === 0) return []
    return arr.filter((item) => item.url === url)
  }

  // Handle cell click
  const handleCellClick = (rowIndex: number, cellIndex: number, cellContent: string) => {
    setClickedCell((prevClickedCell) => {
      if (prevClickedCell.row === rowIndex && prevClickedCell.cell === cellIndex) {
        // If the clicked cell is already highlighted, unhighlight it
        return { row: null, cell: null }
      } else {
        // Otherwise, highlight the clicked cell
        return { row: rowIndex, cell: cellIndex }
      }
    })

    if (cellIndex === 1) {
      // const urlData = filterTableURL(rows, cellContent);
      // setSelectedTableURL(urlData);
      // console.log(urlData);
    }

    // console.log(cellContent, rowIndex, cellIndex);
  }

  const startXRef = useRef(0)
  const parentRef = useRef<HTMLDivElement>(null)
  const tableContainerRef = useRef<HTMLDivElement>(null)

  // Memoize filtered rows
  const filteredRows = useMemo(() => {
    if (!rows || !Array.isArray(rows)) return []

    const normalizeText = (text: string) => text?.toString().toLowerCase().replace(/-/g, "") ?? ""

    const searchTermNormalized = normalizeText(searchTerm)

    return searchTerm
      ? rows.filter((row) => {
          if (!row || typeof row !== "object") return false
          return Object.values(row).some((value) => normalizeText(value?.toString()).includes(searchTermNormalized))
        })
      : rows
  }, [rows, searchTerm])

  // Initialize virtualizer
  const rowVirtualizer = useVirtualizer({
    count: filteredRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => rowHeight, [rowHeight]),
    overscan,
  })

  // Debounced search handler
  const debouncedSearch = useMemo(() => debounce((value: string) => setSearchTerm(value), 300), [])

  // Cleanup
  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  // Column resizing handlers
  const handleMouseDown = useCallback((index: number, event: React.MouseEvent) => {
    setIsResizing(index)
    startXRef.current = event.clientX
    event.preventDefault()
  }, [])

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (isResizing === null) return

      const delta = event.clientX - startXRef.current
      setColumnWidths((prevWidths) => {
        const newWidths = [...prevWidths]
        const currentWidth = Number.parseInt(newWidths[isResizing])
        newWidths[isResizing] = `${Math.max(isResizing === 0 ? 40 : 50, currentWidth + delta)}px`
        return newWidths
      })
      startXRef.current = event.clientX
    },
    [isResizing],
  )

  const handleMouseUp = useCallback(() => {
    setIsResizing(null)
  }, [])

  // Event listeners for resizing
  useEffect(() => {
    if (isResizing !== null) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)

      return () => {
        window.removeEventListener("mousemove", handleMouseMove)
        window.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  // Calculate total table width
  const totalWidth = useMemo(
    () =>
      columnWidths.reduce((acc, width, index) => {
        if (typeof width === "string") {
          if (width.endsWith("px")) {
            return acc + Number.parseFloat(width)
          } else if (width.endsWith("rem")) {
            return acc + Number.parseFloat(width) * 16
          }
        }
        return acc + (index === 0 ? 40 : 100)
      }, 0),
    [columnWidths],
  )

  const toggleColumnAlignment = useCallback((index: number) => {
    setColumnAlignments((prev) => {
      const newAlignments = [...prev]
      newAlignments[index] = newAlignments[index] === "center" ? "left" : "center"
      return newAlignments
    })
  }, [])

  const virtualRows = rowVirtualizer.getVirtualItems()

  return (
    <>
      <div className="text-xs dark:bg-brand-darker sticky top-0 flex gap-1">
        <input
          type="text"
          placeholder="Search..."
          onChange={(e) => debouncedSearch(e.target.value)}
          className="w-full p-1 pl-2 h-6 dark:bg-brand-darker border dark:border-brand-dark dark:text-white border-gray-300 rounded"
        />
        <DownloadButton download={handleDownload} />
        <div className="mr-1.5">
          <ColumnPicker
            columnVisibility={columnVisibility}
            setColumnVisibility={setColumnVisibility}
            headerTitles={headerTitles}
          />
        </div>
      </div>
      <div ref={parentRef} className="w-full h-[calc(100%-1.9rem)] overflow-scroll relative">
        <div ref={tableContainerRef} style={{ minWidth: `${totalWidth}px` }} className="domainCrawlParent sticky top-0">
          <table className="w-full text-xs border-collapse domainCrawlParent h-full">
            <TableHeader
              headers={headerTitles}
              columnWidths={columnWidths}
              columnAlignments={columnAlignments}
              onResize={handleMouseDown}
              onAlignToggle={toggleColumnAlignment}
              columnVisibility={columnVisibility}
            />
            <tbody>
              {filteredRows.length > 0 ? (
                <>
                  {virtualRows.length > 0 && (
                    <tr
                      style={{
                        height: `${virtualRows[0]?.start || 0}px`,
                      }}
                    >
                      <td colSpan={headerTitles.length} style={{ padding: 0, border: "none" }} />
                    </tr>
                  )}
                  {virtualRows.map((virtualRow) => (
                    <tr key={virtualRow.key} style={{ height: `${rowHeight}px` }}>
                      <TableRow
                        row={filteredRows[virtualRow.index]}
                        index={virtualRow.index}
                        columnWidths={columnWidths}
                        columnAlignments={columnAlignments}
                        columnVisibility={columnVisibility}
                        clickedCell={clickedCell}
                        handleCellClick={handleCellClick}
                      />
                    </tr>
                  ))}
                  {virtualRows.length > 0 && (
                    <tr
                      style={{
                        height: `${Math.max(0, rowVirtualizer.getTotalSize() - (virtualRows[virtualRows.length - 1]?.end || 0))}px`,
                      }}
                    >
                      <td colSpan={headerTitles.length} style={{ padding: 0, border: "none" }} />
                    </tr>
                  )}
                </>
              ) : (
                <tr>
                  <td colSpan={headerTitles.length} className="text-center py-4">
                    No data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

export default ImagesCrawlTable

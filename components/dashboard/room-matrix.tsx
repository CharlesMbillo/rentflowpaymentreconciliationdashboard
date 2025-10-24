"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { RoomMatrixData } from "@/lib/actions/rooms"
import { RoomGrid } from "./room-grid"
import { RoomLegend } from "./room-legend"

interface RoomMatrixProps {
  data: RoomMatrixData
}

export function RoomMatrix({ data }: RoomMatrixProps) {
  const [selectedBlock, setSelectedBlock] = useState(data.blocks[0]?.name || "A")

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Room Matrix</CardTitle>
            <CardDescription>
              Color-coded room status for {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </CardDescription>
          </div>
          <RoomLegend />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedBlock} onValueChange={setSelectedBlock}>
          <TabsList className="grid w-full grid-cols-8">
            {data.blocks.map((block) => (
              <TabsTrigger key={block.id} value={block.name}>
                Block {block.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {data.blocks.map((block) => (
            <TabsContent key={block.id} value={block.name} className="mt-6">
              <RoomGrid block={block} rooms={data.rooms[block.id] || []} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}

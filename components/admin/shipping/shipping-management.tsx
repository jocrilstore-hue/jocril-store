"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShippingZonesTable } from "./shipping-zones-table"
import { ShippingClassesTable } from "./shipping-classes-table"
import { ShippingRatesMatrix } from "./shipping-rates-matrix"
import { ShippingSettingsForm } from "./shipping-settings-form"
import { MapPin, Package, Euro, Settings } from "lucide-react"

export function ShippingManagement() {
  const [activeTab, setActiveTab] = useState("zones")

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="zones" className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <span className="hidden sm:inline">Zonas</span>
        </TabsTrigger>
        <TabsTrigger value="classes" className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          <span className="hidden sm:inline">Classes</span>
        </TabsTrigger>
        <TabsTrigger value="rates" className="flex items-center gap-2">
          <Euro className="h-4 w-4" />
          <span className="hidden sm:inline">Taxas</span>
        </TabsTrigger>
        <TabsTrigger value="settings" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Definições</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="zones">
        <ShippingZonesTable />
      </TabsContent>

      <TabsContent value="classes">
        <ShippingClassesTable />
      </TabsContent>

      <TabsContent value="rates">
        <ShippingRatesMatrix />
      </TabsContent>

      <TabsContent value="settings">
        <ShippingSettingsForm />
      </TabsContent>
    </Tabs>
  )
}

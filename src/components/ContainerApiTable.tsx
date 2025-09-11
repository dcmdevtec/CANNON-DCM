import React, { useState } from "react";

interface ContainerApiTableProps {
  data: any[];
}

const statusColors: Record<string, string> = {
  "En Tránsito": "bg-green-100 text-green-800",
  "En Puerto": "bg-yellow-100 text-yellow-800",
  "Entregado": "bg-teal-100 text-teal-800",
  "Retrasado": "bg-red-100 text-red-800",
};

const ContainerApiTable: React.FC<ContainerApiTableProps> = ({ data }) => {
  const [search, setSearch] = useState("");
  const filtered = data.filter(
    (row) =>
      row.container_id?.toLowerCase().includes(search.toLowerCase()) ||
      row.shipping_line_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Contenedores API</h2>
        <input
          type="text"
          className="border rounded px-2 py-1 w-64"
          placeholder="Buscar por contenedor o naviera"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <table className="min-w-full border rounded overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 border">Contenedor</th>
            <th className="px-3 py-2 border">Naviera</th>
            <th className="px-3 py-2 border">Estado</th>
            <th className="px-3 py-2 border">Origen</th>
            <th className="px-3 py-2 border">Destino</th>
            <th className="px-3 py-2 border">Barco</th>
            <th className="px-3 py-2 border">ETA</th>
            <th className="px-3 py-2 border">Acción</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={8} className="text-center py-4 text-gray-400">
                No hay datos para mostrar
              </td>
            </tr>
          ) : (
            filtered.map((row, idx) => (
              <tr key={idx} className="border-b">
                <td className="px-3 py-2 border font-semibold">{row.container_id}</td>
                <td className="px-3 py-2 border">{row.shipping_line_name}</td>
                <td className={`px-3 py-2 border font-semibold rounded ${statusColors[row.container_status] || "bg-gray-100 text-gray-800"}`}>
                  {row.container_status}
                </td>
                <td className="px-3 py-2 border">{row.shipped_from}</td>
                <td className="px-3 py-2 border">{row.shipped_to}</td>
                <td className="px-3 py-2 border">{row.current_vessel_name}</td>
                <td className="px-3 py-2 border">{row.eta_final_destination}</td>
                <td className="px-3 py-2 border text-center">
                  <button className="text-blue-600 hover:underline">Ver</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ContainerApiTable;

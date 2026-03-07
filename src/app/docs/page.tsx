import Link from 'next/link';

export default function DocsPage() {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: '#f5f0e8', color: '#1a1614' }}
    >
      <header
        className="border-b px-6 py-4 flex items-center justify-between"
        style={{ backgroundColor: '#fdfaf4', borderColor: '#1a1614' }}
      >
        <h1
          className="text-xl tracking-tight"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          FPDL Syntax Reference
        </h1>
        <Link
          href="/"
          className="px-3 py-1.5 text-xs font-mono rounded-sm border transition-colors hover:bg-gray-50"
          style={{ borderColor: '#d4cfc8', color: '#5c5048' }}
        >
          &larr; Back to Editor
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-10" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {/* Quick Cheatsheet */}
        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
            Quick Cheatsheet
          </h2>
          <Pre>{`plan "Name" width=W depth=D {
  floor "Name" label="Label" 18000*5000 at=1000,0 {
    room "Name" W*H at=X,Y color=#hex style=dashed {
      stove|sink|fridge|toilet|shower|bathtub     // kitchen & bath
      washer|dryer                                 // laundry
      sofa|tv|bed|table|chair|desk|wardrobe|plant  // furniture
      // furniture: [type] W*H at=X,Y   or   at=center
    }
    stair W*H at=X,Y style=straight|l-shaped|u-shaped
  }
}

// Sizes:  600*400  |  600* (full height)  |  *300 (full width)
// Comments start with //`}</Pre>
        </section>

        {/* Overview */}
        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
            Overview
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: '#5c5048' }}>
            FPDL (Floor Plan Description Language) is a simple, human-readable language for describing
            multi-floor building layouts. A plan contains floors, floors contain rooms, and rooms
            contain furniture items. All dimensions are in millimeters. Sizes use the <code className="font-mono bg-white px-1 rounded">width*height</code> format.
          </p>
        </section>

        {/* Plan Block */}
        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
            Plan Block
          </h2>
          <p className="text-sm mb-2" style={{ color: '#5c5048' }}>
            The root element. Every FPDL file has exactly one plan block.
          </p>
          <Pre>{`plan "My House" width=12000 depth=8000 {
  // floors go here
}`}</Pre>
          <PropTable rows={[
            ['width', 'number', 'Total plan width in mm'],
            ['depth', 'number', 'Total plan depth in mm'],
          ]} />
        </section>

        {/* Floor Block */}
        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
            Floor Block
          </h2>
          <p className="text-sm mb-2" style={{ color: '#5c5048' }}>
            Each floor contains rooms and optionally stairs. Floors can also define their own footprint inside the overall plan.
          </p>
          <Pre>{`floor "Ground Floor" label="GF" 18000*5000 at=1000,0 {
  // rooms and stairs go here
}`}</Pre>
          <PropTable rows={[
            ['label', 'string', 'Optional display label for floor tabs'],
            ['W*H', 'size', 'Optional floor footprint size in mm (default: full plan size)'],
            ['at', 'x,y', 'Optional floor origin inside the plan in mm (default: 0,0)'],
          ]} />
        </section>

        {/* Room Block */}
        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
            Room Block
          </h2>
          <p className="text-sm mb-2" style={{ color: '#5c5048' }}>
            Rooms have a name, size, position, and optional styling. They can contain furniture.
          </p>
          <Pre>{`room "Kitchen" 3200*3200 at=1800,0 color=#ead8d8 {
  stove 800*600 at=200,200
  sink 600*440 at=1200,200
}

// Room without furniture (no braces needed)
room "Hallway" 1200*5000 at=0,0 color=#ede8de`}</Pre>
          <PropTable rows={[
            ['W*H', 'size', 'Room dimensions as width*height in mm'],
            ['at', 'x,y', 'Position within the floor (mm from top-left)'],
            ['color', 'hex', 'Background color (e.g. #ead8d8)'],
            ['style', 'solid|dashed', 'Border style (default: solid)'],
            ['label', 'string', 'Optional display label'],
          ]} />
        </section>

        {/* Stair */}
        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
            Stairs
          </h2>
          <p className="text-sm mb-2" style={{ color: '#5c5048' }}>
            Stairs can be placed at floor level or inside rooms. Three styles are supported.
          </p>
          <Pre>{`// Straight stair (default)
stair 1600*2600 at=7600,1400

// L-shaped stair with landing turn
stair 2000*3000 at=5000,0 style=l-shaped

// U-shaped stair (two parallel runs with landing)
stair 2400*3000 at=5000,0 style=u-shaped`}</Pre>
          <PropTable rows={[
            ['W*H', 'size', 'Stair dimensions (default: 1600*2600)'],
            ['at', 'x,y', 'Position within the floor or room'],
            ['style', 'straight | l-shaped | u-shaped', 'Stair layout style (default: straight)'],
          ]} />
        </section>

        {/* Furniture Types */}
        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
            Furniture Types
          </h2>
          <p className="text-sm mb-3" style={{ color: '#5c5048' }}>
            16 built-in furniture types with default sizes (width * depth in mm). Override by specifying a size.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono border-collapse">
              <thead>
                <tr style={{ borderBottom: '2px solid #d4cfc8' }}>
                  <th className="text-left py-2 pr-4">Type</th>
                  <th className="text-left py-2 pr-4">Default Size</th>
                  <th className="text-left py-2">Category</th>
                </tr>
              </thead>
              <tbody style={{ color: '#5c5048' }}>
                {[
                  ['stove', '800 * 600', 'Kitchen'],
                  ['sink', '600 * 440', 'Kitchen / Bath'],
                  ['fridge', '600 * 700', 'Kitchen'],
                  ['toilet', '500 * 700', 'Bathroom'],
                  ['shower', '900 * 900', 'Bathroom'],
                  ['bathtub', '1700 * 800', 'Bathroom'],
                  ['washer', '600 * 600', 'Laundry'],
                  ['dryer', '600 * 600', 'Laundry'],
                  ['sofa', '3600 * 1200', 'Living'],
                  ['tv', '1200 * 200', 'Living'],
                  ['bed', '1600 * 2000', 'Bedroom'],
                  ['table', '1600 * 800', 'Dining'],
                  ['chair', '450 * 450', 'Dining'],
                  ['desk', '1200 * 600', 'Office'],
                  ['wardrobe', '1800 * 600', 'Bedroom'],
                  ['plant', '400 * 400', 'Decoration'],
                ].map(([type, size, cat]) => (
                  <tr key={type} style={{ borderBottom: '1px solid #e8dfd0' }}>
                    <td className="py-1.5 pr-4 font-semibold" style={{ color: '#0891b2' }}>{type}</td>
                    <td className="py-1.5 pr-4">{size}</td>
                    <td className="py-1.5">{cat}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Properties Reference */}
        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
            Properties Reference
          </h2>
          <PropTable rows={[
            ['at', 'x,y or center', 'Position within parent (mm). Use "center" to auto-center furniture.'],
            ['color', '#hex', 'Background fill color for rooms'],
            ['style', 'solid | dashed', 'Room border style'],
            ['label', '"string"', 'Display label (floors, rooms)'],
            ['width', 'number', 'Plan total width in mm'],
            ['depth', 'number', 'Plan total depth in mm'],
          ]} />
        </section>

        {/* Partial Sizes */}
        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
            Partial Sizes
          </h2>
          <p className="text-sm mb-2" style={{ color: '#5c5048' }}>
            Use <code className="font-mono bg-white px-1 rounded">*</code> with only one dimension to inherit the other from the parent container.
          </p>
          <PropTable rows={[
            ['600*400', 'W*H', 'Explicit width and height'],
            ['600*', 'W*', 'Width = 600, height = parent height'],
            ['*300', '*H', 'Width = parent width, height = 300'],
          ]} />
          <Pre>{`// Shelf spanning full room width
room "Storage" 3000*2000 at=0,0 {
  wardrobe *600 at=0,0    // full room width (3000), depth 600
}

// Partition spanning full room depth
room "Hall" 1200*5000 at=0,0 {
  desk 200* at=600,0      // width 200, full room depth (5000)
}`}</Pre>
        </section>

        {/* Comments */}
        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
            Comments
          </h2>
          <p className="text-sm mb-2" style={{ color: '#5c5048' }}>
            Line comments start with <code className="font-mono bg-white px-1 rounded" style={{ color: '#9ca3af' }}>//</code>.
          </p>
          <Pre>{`// This is a comment
room "Kitchen" 3200*3200 at=0,0 // inline comment`}</Pre>
        </section>

        {/* Full Example */}
        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
            Full Example
          </h2>
          <p className="text-sm mb-2" style={{ color: '#5c5048' }}>
            A complete townhouse with three floors:
          </p>
          <Pre>{`plan "Townhouse" width=20000 depth=5000 {
  floor "Ground Floor" label="GF" {
    room "Garage" 1800*5000 at=0,0 color=#ede8de
    room "Kitchen" 3200*3200 at=1800,0 color=#ead8d8 {
      stove 800*600 at=200,200
      sink 600*440 at=1200,200
      fridge 400*560 at=2000,200
    }
    room "Living Room" 5800*5000 at=9200,0 color=#dde0ea {
      sofa 3600*1200 at=1100,2200
      tv 2400*200 at=1700,100
    }
    stair 1600*2600 at=7600,1400
  }

  floor "Second Floor" label="2F" {
    room "Bedroom" 3900*3300 at=1800,0 color=#ffefd5 {
      bed 1600*2100 at=200,200
      desk 1600*800 at=2000,200
      wardrobe 1600*600 at=2000,1100
    }
    room "Bathroom" 3000*2600 at=7300,0 color=#dce8f0 {
      toilet 500*700 at=400,400
      shower 800*800 at=1100,200
    }
    stair 1600*5000 at=5700,0
  }
}`}</Pre>
        </section>
      </main>
    </div>
  );
}

function Pre({ children }: { children: string }) {
  return (
    <pre
      className="text-xs leading-relaxed p-4 rounded overflow-x-auto"
      style={{
        backgroundColor: '#fdfaf4',
        border: '1px solid #d4cfc8',
        fontFamily: "'DM Mono', monospace",
        color: '#1a1614',
      }}
    >
      {children}
    </pre>
  );
}

function PropTable({ rows }: { rows: [string, string, string][] }) {
  return (
    <div className="overflow-x-auto mt-2">
      <table className="w-full text-xs font-mono border-collapse">
        <thead>
          <tr style={{ borderBottom: '2px solid #d4cfc8' }}>
            <th className="text-left py-2 pr-4">Property</th>
            <th className="text-left py-2 pr-4">Type</th>
            <th className="text-left py-2">Description</th>
          </tr>
        </thead>
        <tbody style={{ color: '#5c5048' }}>
          {rows.map(([prop, type, desc]) => (
            <tr key={prop} style={{ borderBottom: '1px solid #e8dfd0' }}>
              <td className="py-1.5 pr-4 font-semibold" style={{ color: '#dc2626' }}>{prop}</td>
              <td className="py-1.5 pr-4">{type}</td>
              <td className="py-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

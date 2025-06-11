import React, { useState, useRef, useEffect } from 'react'
import { Stage, Layer, Rect, Image as KonvaImage } from 'react-konva'
import { Annotation, AIAnnotation, User } from '../../types'
import { v4 as uuidv4 } from 'uuid'
import Button from '../ui/Button'
import Select from '../ui/Select'
import Input from '../ui/Input'

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600

interface Props {
  imageUrl: string
  annotations: Annotation[]
  aiAnnotations: AIAnnotation[]
  showAI: boolean
  onAnnotationSelect: (id: string) => void
  onAnnotationsChange: (newAnnots: Annotation[]) => void
  user: User  // <-- add user prop
}

const AnnotationCanvas: React.FC<Props> = ({
  imageUrl,
  annotations,
  aiAnnotations,
  showAI,
  onAnnotationSelect,
  onAnnotationsChange,
  user
}) => {
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [baseScale, setBaseScale] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [drawing, setDrawing] = useState(false)
  const [tmp, setTmp] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [type, setType] = useState('hemorrhage')
  const [severity, setSeverity] = useState<'mild'|'moderate'|'severe'>('mild')
  const [otherDiseases, setOtherDiseases] = useState('')
  const stageRef = useRef<any>(null)

  useEffect(() => {
    const i = new window.Image()
    i.src = imageUrl
    i.onload = () => {
      const s = Math.min(CANVAS_WIDTH/i.width, CANVAS_HEIGHT/i.height)
      setBaseScale(s)
      setImg(i)
    }
  }, [imageUrl])

  const colorFor = (sev: string) => ({
    mild: '#FFC107',
    moderate: '#FF9800',
    severe: '#F44336'
  }[sev] || '#000')

  const handleDown = (e: any) => {
    if (drawing) return
    const pos = e.target.getStage().getPointerPosition()
    setDrawing(true)
    setTmp({ x: pos.x, y: pos.y, w: 0, h: 0 })
  }

  const handleMove = (e: any) => {
    if (!drawing || !tmp) return
    const pos = e.target.getStage().getPointerPosition()
    setTmp({ ...tmp, w: pos.x - tmp.x, h: pos.y - tmp.y })
  }

  const handleUp = () => {
    if (!drawing || !tmp) { setDrawing(false); return }
    setDrawing(false)
    const { x, y, w, h } = tmp
    if (Math.abs(w) < 5 || Math.abs(h) < 5) { setTmp(null); return }
    const rx = w<0 ? x+w : x
    const ry = h<0 ? y+h : y
    const nw = Math.abs(w), nh = Math.abs(h)
    if (type === 'no_dr' && !otherDiseases.trim()) {
      alert('Please specify other diseases')
      setTmp(null)
      return
    }
    const newA: Annotation = {
      id: uuidv4(),
      x: rx,
      y: ry,
      width: nw,
      height: nh,
      type,
      severity,
      color: colorFor(severity),
      createdAt: new Date().toISOString(),
      created_by: user.email, // << utiliser l'utilisateur connecté !
      ...(type === 'no_dr' ? { other_diseases: otherDiseases } : {})
    }
    onAnnotationsChange([...annotations, newA])
    setTmp(null)
    setOtherDiseases('')
  }

  return (
    <div className="flex flex-col">
      {/* contrôles zoom / type / sev */}
      <div className="mb-4 flex items-center space-x-4">
        <div className="space-x-2">
          <Button size="sm" onClick={() => setZoom(z=>z*1.2)}>Zoom In</Button>
          <Button size="sm" onClick={() => setZoom(z=>z/1.2)}>Zoom Out</Button>
          <Button size="sm" variant="outline" onClick={() => setZoom(1)}>Reset</Button>
        </div>
        <div className="flex space-x-4">
          <Select label="Anomaly Type" value={type} onChange={e=>setType(e.target.value)} className="w-40"
            options={[
              {value:'hemorrhage',label:'Hemorrhage'},
              {value:'microaneurysm',label:'Microaneurysm'},
              {value:'exudate',label:'Exudate'},
              {value:'neovascularization',label:'Neovascularization'},
              {value:'no_dr',label:'No DR'},
            ]}
          />
          {type !== 'no_dr' && (
            <Select label="Severity" value={severity} onChange={e=>setSeverity(e.target.value as any)} className="w-40"
              options={[
                {value:'mild',label:'Mild'},
                {value:'moderate',label:'Moderate'},
                {value:'severe',label:'Severe'},
              ]}
            />
          )}
          {type === 'no_dr' && (
            <Input
              label="Other Diseases"
              value={otherDiseases}
              onChange={e => setOtherDiseases(e.target.value)}
              required
              className="w-40"
            />
          )}
        </div>
      </div>
      <div className="border rounded-lg overflow-hidden bg-gray-100">
        <Stage
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          ref={stageRef}
          scaleX={zoom}
          scaleY={zoom}
          onMouseDown={handleDown}
          onMouseMove={handleMove}
          onMouseUp={handleUp}
          className="bg-gray-800"
        >
          <Layer>
            {img && (
              <KonvaImage
                image={img}
                x={(CANVAS_WIDTH - img.width*baseScale)/2}
                y={(CANVAS_HEIGHT - img.height*baseScale)/2}
                width={img.width*baseScale}
                height={img.height*baseScale}
              />
            )}
            {annotations.map(a=>(
              <Rect
                key={a.id}
                x={a.x} y={a.y}
                width={a.width} height={a.height}
                stroke={a.color}
                strokeWidth={2}
                dash={[5,2]}
                onClick={()=>onAnnotationSelect(a.id)}
              />
            ))}
            {showAI && aiAnnotations.map(a=>(
              <Rect
                key={a.id}
                x={a.x} y={a.y}
                width={a.width} height={a.height}
                stroke={a.color}
                strokeWidth={2}
                dash={[2,2]}
              />
            ))}
            {drawing && tmp && (
              <Rect
                x={tmp.x} y={tmp.y}
                width={tmp.w} height={tmp.h}
                stroke={colorFor(severity)}
                strokeWidth={2}
                dash={[5,2]}
              />
            )}
          </Layer>
        </Stage>
      </div>
      <p className="mt-2 text-sm text-gray-500">
        Click & drag to create a new annotation, puis Save/Reset/Delete dans la colonne de droite.
      </p>
    </div>
  )
}

export default AnnotationCanvas

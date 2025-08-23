import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { writeFile, mkdir, unlink, rmdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'
import { v4 as uuidv4 } from 'uuid'

// Helper function for task image upload
async function handleTaskImageUpload(
  imageFile: File | null,
  taskId: number,
  existingImagePath?: string | null
): Promise<string | null> {
  if (!imageFile) return null

  try {
    // Delete old image if exists
    if (existingImagePath) {
      try {
        const oldImagePath = path.join(process.cwd(), 'public', existingImagePath.split('?')[0])
        if (existsSync(oldImagePath)) {
          await unlink(oldImagePath)
        }
      } catch (error) {
        console.error('Error deleting old task image:', error)
      }
    }

    // Create directory
    const uploadDir = path.join(process.cwd(), 'public', 'tasksImages', taskId.toString())
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate filename
    const fileExtension = path.extname(imageFile.name)
    const fileName = `task${fileExtension}`
    const filePath = path.join(uploadDir, fileName)

    // Save file
    const buffer = Buffer.from(await imageFile.arrayBuffer())
    await writeFile(filePath, buffer)

    // Add version parameter
    return `/tasksImages/${taskId}/${fileName}?v=${Date.now()}`
  } catch (error) {
    console.error('Error handling task image upload:', error)
    return null
  }
}

// Function for handling solution images
async function handleSolutionImages(
  solutionBlocks: any[],
  formData: FormData,
  taskId: number
): Promise<any[]> {
  const updatedBlocks = [...solutionBlocks]
  
  for (let i = 0; i < updatedBlocks.length; i++) {
    const block = updatedBlocks[i]
    if (block.type === 'image') {
      const imageFile = formData.get(`solutionImage_${i}`) as File | null
      
      if (imageFile) {
        try {
          // Create solutions directory
          const solutionsDir = path.join(process.cwd(), 'public', 'solutions', taskId.toString())
          if (!existsSync(solutionsDir)) {
            await mkdir(solutionsDir, { recursive: true })
          }
          
          // Delete old image if exists
          if (block.previewUrl) {
            try {
              const oldImagePath = path.join(process.cwd(), 'public', block.previewUrl.split('?')[0])
              if (existsSync(oldImagePath)) {
                await unlink(oldImagePath)
              }
            } catch (error) {
              console.error('Error deleting old solution image:', error)
            }
          }
          
          // Generate unique filename
          const uniqueName = `${uuidv4()}${path.extname(imageFile.name)}`
          const uploadPath = path.join(solutionsDir, uniqueName)
          
          // Save file
          const buffer = Buffer.from(await imageFile.arrayBuffer())
          await writeFile(uploadPath, buffer)
          
          updatedBlocks[i] = {
            ...block,
            previewUrl: `/solutions/${taskId}/${uniqueName}?v=${Date.now()}`,
            file: null
          }
        } catch (error) {
          console.error('Error handling solution image upload:', error)
        }
      }
    }
  }
  
  return updatedBlocks
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Get filter arrays
    const numbers = searchParams.getAll('number')
    const types = searchParams.getAll('type')
    const sourceTypes = searchParams.getAll('sourceType')
    const years = searchParams.getAll('year')
    const waves = searchParams.getAll('wave')
    
    // Pagination
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 10

    // Validation
    if (isNaN(page) || page < 1) throw new Error('Invalid page parameter')
    if (isNaN(limit) || limit < 1) throw new Error('Invalid limit parameter')

    // Build filter conditions
    const where: any = {}
    
    const search = searchParams.get('search')

    // Add to your where conditions
    if (search) {
      // Проверяем, является ли поисковый запрос числом (ID)
      const searchId = parseInt(search);
      if (!isNaN(searchId)) {
        where.id = searchId;
      } else {
        where.text = {
           contains: search,
           mode: 'insensitive'
         }
      }
    }
    
    // Number filter
    if (numbers.length > 0) {
      where.number = { in: numbers }
    }
    
    // Type filter
    if (types.length > 0) {
      where.type = { in: types }
    }
    
    // Video source filter
    const hasVideo = searchParams.get('hasVideo')
    if (hasVideo === 'true') {
      where.videoSrc = { not: null }
    } else if (hasVideo === 'false') {
      where.videoSrc = null
    }
    
    // Source filtering
    if (sourceTypes.length > 0 || years.length > 0 || waves.length > 0) {
      const sourceConditions: any[] = []

      sourceTypes.forEach(sourceType => {
        years.forEach(year => {
          waves.forEach(wave => {
            const condition: any = {}
            if (sourceType) condition.sourceType = sourceType
            if (year) {
              const yearNum = Number(year)
              if (!isNaN(yearNum)) condition.year = yearNum
            }
            if (wave) condition.wave = wave
            sourceConditions.push(condition)
          })
        })

        if (years.length === 0 && waves.length === 0) {
          sourceConditions.push({ sourceType })
        }
      })

      if (sourceTypes.length === 0) {
        years.forEach(year => {
          waves.forEach(wave => {
            const condition: any = {}
            const yearNum = Number(year)
            if (!isNaN(yearNum)) condition.year = yearNum
            if (wave) condition.wave = wave
            sourceConditions.push(condition)
          })
        })
      }

      where.OR = sourceConditions.map(condition => ({
        sources: {
          array_contains: [condition]
        }
      }))
    }

    // Database query
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.task.count({ where })
    ])

    return NextResponse.json({
      data: tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
    
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch tasks',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    
    // Main data
    const number = formData.get('number') as string
    const text = formData.get('text') as string
    const type = formData.get('type') as string
    const answer = formData.get('answer') as string
    const sourcesStr = formData.get('sources') as string
    const solutionStr = formData.get('solution') as string
    const videoSrc = formData.get('videoSrc') as string | null
    const imageFile = formData.get('image') as File | null
    const solutionImages = formData.getAll('solutionImages') as File[]

    // Validation
    if (!number || !text || !type || !answer || !sourcesStr || !solutionStr) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Parse data
    const sources = JSON.parse(sourcesStr)
    const solutionBlocks = JSON.parse(solutionStr)

    // Create task first to get ID
    const newTask = await prisma.task.create({
      data: {
        number,
        text,
        type,
        answer,
        sources,
        solution: solutionStr,
        videoSrc: videoSrc || null,
        image: null
      }
    })

    // Handle task image upload
    let imagePath = null
    if (imageFile) {
      imagePath = await handleTaskImageUpload(imageFile, newTask.id, null)
    }

    // Handle solution images
    const updatedSolutionBlocks = await Promise.all(
      solutionBlocks.map(async (block: any) => {
        if (block.type === 'image' && block.fileName) {
          const foundImage = solutionImages.find(img => 
            img.name === block.fileName.split('_').slice(1).join('_')
          )
          
          if (foundImage) {
            const solutionsDir = path.join(process.cwd(), 'public', 'solutions', newTask.id.toString())
            if (!existsSync(solutionsDir)) {
              await mkdir(solutionsDir, { recursive: true })
            }
            
            const uniqueName = `${uuidv4()}${path.extname(foundImage.name)}`
            const uploadPath = path.join(solutionsDir, uniqueName)
            
            const buffer = Buffer.from(await foundImage.arrayBuffer())
            await writeFile(uploadPath, buffer)
            
            return {
              ...block,
              previewUrl: `/solutions/${newTask.id}/${uniqueName}?v=${Date.now()}`,
              fileName: undefined
            }
          }
        }
        return block
      })
    )

    // Update task with image path and solution
    const updatedTask = await prisma.task.update({
      where: { id: newTask.id },
      data: {
        image: imagePath,
        solution: JSON.stringify(updatedSolutionBlocks)
      }
    })

    return NextResponse.json(updatedTask, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const formData = await request.formData()
    
    // Extract data
    const id = formData.get('id') as string
    const number = formData.get('number') as string
    const text = formData.get('text') as string
    const type = formData.get('type') as string
    const solution = formData.get('solution') as string
    const answer = formData.get('answer') as string
    const sourcesStr = formData.get('sources') as string
    const videoSrc = formData.get('videoSrc') as string | null
    const removeVideo = formData.get('removeVideo') === 'true'
    const imageFile = formData.get('image') as File | null
    const removeImage = formData.get('removeImage') === 'true'

    // Validation
    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      )
    }

    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id: Number(id) }
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Parse sources
    let sources
    try {
      sources = JSON.parse(sourcesStr)
      if (!Array.isArray(sources)) throw new Error('Sources must be an array')
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid sources format' },
        { status: 400 }
      )
    }

    // Parse solution
    let solutionBlocks
    try {
      solutionBlocks = JSON.parse(solution)
      if (!Array.isArray(solutionBlocks)) throw new Error('Solution must be an array')
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid solution format' },
        { status: 400 }
      )
    }

    // Handle task image
    let imagePath = existingTask.image
    if (removeImage) {
      if (imagePath) {
        try {
          const oldImagePath = path.join(process.cwd(), 'public', imagePath.split('?')[0])
          if (existsSync(oldImagePath)) {
            await unlink(oldImagePath)
          }
          
          const taskImageDir = path.join(process.cwd(), 'public', 'tasksImages', existingTask.id.toString())
          try {
            await rmdir(taskImageDir)
          } catch (dirError) {}
        } catch (error) {
          console.error('Error deleting task image:', error)
        }
      }
      imagePath = null
    } else if (imageFile) {
      imagePath = await handleTaskImageUpload(
        imageFile,
        existingTask.id,
        existingTask.image
      )
    }

    // Handle solution images
    const updatedSolutionBlocks = await handleSolutionImages(
      solutionBlocks,
      formData,
      existingTask.id
    )

    // Update task
    const updatedTask = await prisma.task.update({
      where: { id: Number(id) },
      data: {
        number,
        text,
        type,
        solution: JSON.stringify(updatedSolutionBlocks),
        answer,
        sources,
        image: imagePath,
        videoSrc: removeVideo ? null : videoSrc || existingTask.videoSrc
      }
    })

    return NextResponse.json(updatedTask, { status: 200 })

  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      )
    }

    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id: Number(id) }
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Delete task image
    if (existingTask.image) {
      try {
        const imagePath = path.join(process.cwd(), 'public', existingTask.image.split('?')[0])
        if (existsSync(imagePath)) {
          await unlink(imagePath)
        }
        
        const taskImageDir = path.join(process.cwd(), 'public', 'tasksImages', existingTask.id.toString())
        try {
          await rmdir(taskImageDir)
        } catch (dirError) {}
      } catch (error) {
        console.error('Error deleting task image:', error)
      }
    }

    // Delete solution images
    try {
      const solutionBlocks = JSON.parse(existingTask.solution)
      if (Array.isArray(solutionBlocks)) {
        for (const block of solutionBlocks) {
          if (block.type === 'image' && block.previewUrl) {
            const imagePath = path.join(
              process.cwd(), 
              'public', 
              block.previewUrl.split('?')[0]
            )
            if (existsSync(imagePath)) {
              await unlink(imagePath)
            }
          }
        }
        
        const solutionsDir = path.join(process.cwd(), 'public', 'solutions', existingTask.id.toString())
        if (existsSync(solutionsDir)) {
          try {
            await rmdir(solutionsDir)
          } catch (dirError) {}
        }
      }
    } catch (error) {
      console.error('Error deleting solution images:', error)
    }

    // Delete task from database
    await prisma.task.delete({
      where: { id: Number(id) }
    })

    return NextResponse.json(
      { message: 'Task deleted successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
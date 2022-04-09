const router = require('express').Router()
const Task = require('../models/Task')
const auth = require('../middleware/auth')

//Endpoint na tworzenie tasków
router.post('/', auth, async (req,res)=> {

    // const task = new Task(req.body)

    const task = new Task({
        ...req.body,
        owner:req.user._id
    })

    try {
        await task.save()
        res.status(201).send(task)
    } catch(e) {
        res.status(400).send(e)
    }
})


//Endpoint na fetch wszystkich tasków

router.get('/', auth, async (req,res)=> {

    const match = {}
    const sort = {}
    // query na wyszukanie completed true albo false ?completed=true||false
    if (req.query.completed) {
        match.completed = req.query.completed === 'true'
    }

    //query na sortowanie ?sortBy='po czym chcesortowac':'jak chce sortowac'
    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')

        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    try {
        await req.user.populate({
            path: 'tasks',
            match,
            // query na paginacje i limit
            options: {
                //?limit='liczba ktora ustala limit query'
                limit: parseInt(req.query.limit),
                //?skip='liczba ktora ustala ile rekordow trzeba skipnac'
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.tasks)
    }catch(e) {
        res.status(500).send()
    }

})

//Endpoint na fetch poszczególnego taska
router.get('/:id', auth, async (req,res)=> {
    const _id = req.params.id

    try {

        const task = await Task.findOne({ _id,owner: req.user._id })

        if (!task) return res.status(404).send()

        res.send(task)

    } catch(e) {
        res.status(500).send()
    }    
})


//Endpoint na update taska
router.patch('/:id', auth, async (req,res)=> {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description','completed']
    const isValidOperation = updates.every(update=>{
        return allowedUpdates.includes(update)
    })

    const _id = req.params.id

    if (!isValidOperation) return res.status(400).send('Invalid update')
    

    try {
        const task = await Task.findOne({_id,owner: req.user._id})

        if (!task) return res.status(404).send()

        updates.forEach(update=> task[update] = req.body[update])

        await task.save()

        res.send(task)

    } catch (e) {
        res.status(400).send(e)
    }
})


//Endpoint na kasowanie taska
router.delete('/:id', auth, async (req,res)=> {
    const _id = req.params.id

    try {
        
        const task = await Task.findOneAndDelete({_id,owner: req.user._id})
                
        if(!task) res.status(400).send()

        res.send(task)

    } catch (e) {
        res.status(500).send()
    }
})



module.exports = router
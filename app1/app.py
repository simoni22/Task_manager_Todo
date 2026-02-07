from flask import Flask, render_template, request, redirect, url_for

app = Flask(__name__)

# In-memory storage
tasks = []
task_id_counter = 1

@app.route('/')
def index():
    filter_type = request.args.get('filter', 'all')
    
    if filter_type == 'active':
        filtered_tasks = [t for t in tasks if not t['completed']]
    elif filter_type == 'completed':
        filtered_tasks = [t for t in tasks if t['completed']]
    else:
        filtered_tasks = tasks
    
    return render_template('index.html', tasks=filtered_tasks, current_filter=filter_type)

@app.route('/add', methods=['POST'])
def add_task():
    global task_id_counter
    text = request.form.get('text', '').strip()
    
    if text:
        tasks.append({
            'id': task_id_counter,
            'text': text,
            'completed': False
        })
        task_id_counter += 1
    
    return redirect(url_for('index', filter=request.args.get('filter', 'all')))

@app.route('/toggle/<int:task_id>')
def toggle_task(task_id):
    for task in tasks:
        if task['id'] == task_id:
            task['completed'] = not task['completed']
            break
    
    return redirect(url_for('index', filter=request.args.get('filter', 'all')))

if __name__ == '__main__':
    app.run(debug=True, port=5000)

import tensorflow as tf

# Create a large tensor to allocate more GPU memory
large_tensor = tf.random.uniform((10000, 10000))

# Perform a matrix multiplication operation
result = tf.matmul(large_tensor, large_tensor)

# Check GPU memory usage again
mem_info = tf.config.experimental.get_memory_info('GPU:0')
print(f"Current memory usage: {mem_info['current']} bytes")
print(f"Peak memory usage: {mem_info['peak']} bytes")

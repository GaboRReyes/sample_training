package com.example;
import java.io.DataInput;
import java.io.DataOutput;
import java.io.IOException;
import java.text.DecimalFormat;
import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.io.LongWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.io.Writable;
import org.apache.hadoop.mapreduce.Job;
import org.apache.hadoop.mapreduce.Mapper;
import org.apache.hadoop.mapreduce.Reducer;
import org.apache.hadoop.mapreduce.lib.input.FileInputFormat;
import org.apache.hadoop.mapreduce.lib.output.FileOutputFormat;

public class CalificacionesPorTienda {

    public static class StoreStats implements Writable {
        private int totalProducts;
        private int highlyRatedProducts;
        private double totalRating;
        
        public StoreStats() {
            this.totalProducts = 0;
            this.highlyRatedProducts = 0;
            this.totalRating = 0.0;
        }
        
        public StoreStats(int totalProducts, int highlyRatedProducts, double totalRating) {
            this.totalProducts = totalProducts;
            this.highlyRatedProducts = highlyRatedProducts;
            this.totalRating = totalRating;
        }
        
        public int getTotalProducts() { return totalProducts; }
        public int getHighlyRatedProducts() { return highlyRatedProducts; }
        public double getTotalRating() { return totalRating; }
        
        public void add(StoreStats other) {
            this.totalProducts += other.totalProducts;
            this.highlyRatedProducts += other.highlyRatedProducts;
            this.totalRating += other.totalRating;
        }
        
        @Override
        public void write(DataOutput out) throws IOException {
            out.writeInt(totalProducts);
            out.writeInt(highlyRatedProducts);
            out.writeDouble(totalRating);
        }
        
        @Override
        public void readFields(DataInput in) throws IOException {
            totalProducts = in.readInt();
            highlyRatedProducts = in.readInt();
            totalRating = in.readDouble();
        }
        
        @Override
        public String toString() {
            return totalProducts + "," + highlyRatedProducts + "," + totalRating;
        }
    }

    public static class StoreRatingMapper extends Mapper<LongWritable, Text, Text, StoreStats> {
        private Text storeName = new Text();
        
        @Override
        public void map(LongWritable key, Text value, Context context) throws IOException, InterruptedException {
            if (key.get() == 0 && value.toString().contains("id,storeId")) {
                return;
            }

            String[] campos = value.toString().split(",");
            try {
                if (campos.length < 15) {
                    return;
                }
                
                String nombreTienda = campos[2].trim();
                String ratingTexto = campos[4].trim();
                
                if (ratingTexto.isEmpty() || ratingTexto.equals("0") || ratingTexto.equals("0.0")) {
                    return;
                }
                
                double rating = Double.parseDouble(ratingTexto);
                
                int totalProducts = 1;
                int highlyRatedProducts = (rating >= 4.5) ? 1 : 0;
                double totalRating = rating;
                
                StoreStats stats = new StoreStats(totalProducts, highlyRatedProducts, totalRating);
                
                storeName.set(nombreTienda);
                context.write(storeName, stats);
                
            } catch (Exception e) {
                System.err.println("Error procesando línea: " + value.toString());
            }
        }
    }

    public static class StoreRatingReducer extends Reducer<Text, StoreStats, Text, Text> {
        private DecimalFormat df = new DecimalFormat("#.##");
        private DecimalFormat percentage = new DecimalFormat("#.#");
        
        @Override
        public void reduce(Text key, Iterable<StoreStats> values, Context context)
                throws IOException, InterruptedException {

            StoreStats totalStats = new StoreStats();
            
            for (StoreStats stats : values) {
                totalStats.add(stats);
            }
            
            int totalProducts = totalStats.getTotalProducts();
            int highlyRatedProducts = totalStats.getHighlyRatedProducts();
            double averageRating = totalStats.getTotalRating() / totalProducts;
            double percentageHighlyRated = (double) highlyRatedProducts / totalProducts * 100;
            
            String result = "Highly Rated Products: " + highlyRatedProducts + 
                           " (" + percentage.format(percentageHighlyRated) + "%) | " +
                           "Average Rating: " + df.format(averageRating) + " | " +
                           "Total Products: " + totalProducts;
            
            context.write(key, new Text(result));
        }
    }

    public static void main(String[] args) throws Exception {
        if (args.length != 2) {
            System.err.println("Uso: CalificacionesPorTienda <input path> <output path>");
            System.exit(-1);
        }
        
        Configuration conf = new Configuration();
        Job job = Job.getInstance(conf, "Análisis de Calificaciones por Tienda");
        job.setJarByClass(CalificacionesPorTienda.class);

        job.setMapperClass(StoreRatingMapper.class);
        job.setReducerClass(StoreRatingReducer.class);

        job.setMapOutputKeyClass(Text.class);
        job.setMapOutputValueClass(StoreStats.class);
        job.setOutputKeyClass(Text.class);
        job.setOutputValueClass(Text.class);

        FileInputFormat.addInputPath(job, new Path(args[0]));
        FileOutputFormat.setOutputPath(job, new Path(args[1]));

        System.exit(job.waitForCompletion(true) ? 0 : 1);
    }
}